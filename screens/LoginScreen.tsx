import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { KeypadIcon } from '../components/icons/KeypadIcon';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { verifyPin } from '../utils/auth';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'pin' | 'authenticating'>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinHash] = useLocalStorage('pinHash', '');
  const [pinSalt] = useLocalStorage('pinSalt', '');

  useEffect(() => {
    if (view === 'pin' && pin.length === 4) {
      handlePinVerify();
    }
  }, [pin, view]);

  const handlePinVerify = async () => {
    setIsLoading(true);
    setError(null);
    const isValid = await verifyPin(pin, pinHash, pinSalt);
    if (isValid) {
      onLoginSuccess();
    } else {
      setError('PIN errato. Riprova.');
      setTimeout(() => {
        setPin('');
        setError(null);
        setIsLoading(false);
      }, 1500);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'authenticating':
        return (
          <div className="text-center flex flex-col items-center justify-center min-h-[340px]">
            <SpinnerIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">In attesa...</h2>
            <p className="text-slate-500">Verifica in corso...</p>
          </div>
        );

      case 'pin':
      default:
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Accedi</h2>
            <p
              className={`h-10 flex items-center justify-center transition-colors ${
                error ? 'text-red-500' : 'text-slate-500'
              }`}
            >
              {isLoading ? 'Verifica in corso...' : error || 'Inserisci il tuo PIN di 4 cifre.'}
            </p>
            <PinInput pin={pin} onPinChange={setPin} />

            <button
              onClick={handlePinVerify}
              className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <KeypadIcon className="w-5 h-5" />
              Accedi con PIN
            </button>
          </div>
        );
    }
  };

  return <AuthLayout>{renderContent()}</AuthLayout>;
};

export default LoginScreen;
