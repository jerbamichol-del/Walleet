import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon';

interface FloatingActionButtonProps {
  onAdd: () => void;
  onVoice: () => void;
  onCamera: () => void;
  onUpload: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAdd, onVoice, onCamera, onUpload }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleActionClick = (action: () => void) => {
        action();
        setIsOpen(false);
    };
    
    const actions = [
        { label: 'Aggiungi con Voce', icon: <MicrophoneIcon className="w-7 h-7" />, onClick: () => handleActionClick(onVoice), bgColor: 'bg-purple-600', hoverBgColor: 'hover:bg-purple-700' },
        { label: 'Usa Fotocamera', icon: <CameraIcon className="w-7 h-7" />, onClick: () => handleActionClick(onCamera), bgColor: 'bg-sky-600', hoverBgColor: 'hover:bg-sky-700' },
        { label: 'Carica Immagine', icon: <ComputerDesktopIcon className="w-7 h-7" />, onClick: () => handleActionClick(onUpload), bgColor: 'bg-teal-600', hoverBgColor: 'hover:bg-teal-700' },
        { label: 'Aggiungi Spesa', icon: <PlusIcon className="w-7 h-7" />, onClick: () => handleActionClick(onAdd), bgColor: 'bg-indigo-500', hoverBgColor: 'hover:bg-indigo-600' }
    ];

    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-center z-40">
            <div 
                className="flex flex-col-reverse items-center gap-4 mb-4"
            >
                {actions.map((action, index) => (
                     <div 
                         key={action.label} 
                         className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
                         style={{ transitionDelay: isOpen ? `${(actions.length - 1 - index) * 50}ms` : '0ms' }}
                     >
                        <button
                            onClick={action.onClick}
                            className={`flex justify-center items-center w-14 h-14 ${action.bgColor} text-white rounded-full shadow-lg ${action.hoverBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ring-white/80`}
                            aria-label={action.label}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>
            
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-center items-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all transform duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-expanded={isOpen}
                aria-label={isOpen ? "Chiudi menu azioni" : "Apri menu azioni"}
            >
                 <div className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-45' : ''}`}>
                     <PlusIcon className="w-8 h-8" />
                </div>
            </button>
        </div>
    );
};

export default FloatingActionButton;