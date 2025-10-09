import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { KeypadIcon } from '../components/icons/KeypadIcon';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { verifyPin } from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinHash] = useLocalStorage('pinHash', '');
  const [pinSalt] = useLocalStorage('pinSalt', '');

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

  useEffect(() => {
    if (pin.length === 4) {
      handlePinVerify();
    }
  }, [pin]);

  return (
    <AuthLayout>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Inserisci il PIN</h2>
        <p className={`h-10 flex items-center justify-center transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`}>
          {isLoading ? 'Verifica in corso...' : (error || 'Inserisci il tuo PIN di 4 cifre.')}
        </p>
        <PinInput pin={pin} onPinChange={setPin} />
        <div className="space-y-4 mt-4">
          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm"
            onClick={() => {}}
          >
            <KeypadIcon className="w-5 h-5" />
            Accedi con PIN
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginScreen;
