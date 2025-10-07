
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Expense } from '../types';
import { parseExpensesFromImage } from '../utils/ai';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { addImageToQueue } from '../utils/db';
import { XMarkIcon } from './icons/XMarkIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon';

interface ImageParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (data: Partial<Omit<Expense, 'id'>>[]) => void;
  onQueued: () => void;
  source: 'screenshot' | 'camera';
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const ImageParserModal: React.FC<ImageParserModalProps> = ({ isOpen, onClose, onParsed, onQueued, source }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  useEffect(() => {
      // Reset state when modal is closed/reopened
      if (!isOpen) {
          setSelectedImage(null);
          setPreviewUrl(null);
          setIsLoading(false);
          setError(null);
      }
  }, [isOpen]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleParse = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    if (isOnline) {
      try {
        const base64Image = await fileToBase64(selectedImage);
        const parsedData = await parseExpensesFromImage(base64Image, selectedImage.type);
        onParsed(parsedData);
      } catch (err) {
        console.error(err);
        setError('Impossibile analizzare l\'immagine. Riprova con un\'immagine più chiara.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Offline logic
      try {
        const base64Image = await fileToBase64(selectedImage);
        await addImageToQueue({
          id: crypto.randomUUID(),
          base64Image,
          mimeType: selectedImage.type,
        });
        onQueued();
        // The modal will be closed by the onQueued handler in App.tsx
      } catch (err) {
        console.error("Failed to queue image:", err);
        setError('Impossibile salvare l\'immagine per l\'analisi offline.');
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  const title = source === 'camera' ? 'Aggiungi da Fotocamera' : 'Aggiungi da Screenshot';
  const Icon = source === 'camera' ? CameraIcon : ComputerDesktopIcon;
  const buttonText = selectedImage ? 'Usa un\'altra immagine' : (source === 'camera' ? 'Scatta Foto' : 'Carica Immagine');
  const submitButtonText = isOnline ? 'Analizza Immagine' : 'Salva per Dopo';
  const loadingText = isOnline ? 'Analisi in corso...' : 'Salvataggio...';

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-100' : 'opacity-0'} bg-slate-900/50 backdrop-blur-sm`}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-slate-50 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Chiudi"
            disabled={isLoading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture={source === 'camera' ? 'environment' : undefined}
            onChange={handleFileChange}
          />
          
          {previewUrl ? (
            <div className="mb-4 border-2 border-dashed border-slate-300 rounded-lg p-2">
                <img src={previewUrl} alt="Anteprima ricevuta" className="w-full h-auto max-h-64 object-contain rounded" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg bg-slate-100 text-slate-500">
                <Icon className="w-16 h-16 mb-4" />
                <p>Nessuna immagine selezionata.</p>
                <p className="text-sm text-slate-400 mt-1">Carica o scatta una foto di una ricevuta.</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        </div>

        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={!selectedImage || isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <SpinnerIcon className="w-5 h-5" />}
            {isLoading ? loadingText : submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageParserModal;