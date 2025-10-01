import React, { useEffect } from 'react';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'info' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'info' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);
  
  const styles = {
    info: {
      bg: 'bg-blue-100 border-blue-300',
      text: 'text-blue-800',
      icon: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    },
    success: {
      bg: 'bg-green-100 border-green-300',
      text: 'text-green-800',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    },
    error: {
      bg: 'bg-red-100 border-red-300',
      text: 'text-red-800',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 animate-fade-in-up">
      <div className={`flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg border ${styles[type].bg}`} role="alert">
        <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
          {styles[type].icon}
        </div>
        <div className={`ms-3 text-sm font-medium ${styles[type].text}`}>
          {message}
        </div>
        <button 
          type="button" 
          className={`ms-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ${styles[type].text} hover:bg-white/50`} 
          onClick={onClose} 
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;