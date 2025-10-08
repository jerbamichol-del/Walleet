import React, { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { KeypadIcon } from '../components/icons/KeypadIcon';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
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
  const isOnline = useOnlineStatus();

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

  // Controlla il PIN automaticamente quando completo
  React.useEffect(() => {
    if (pin.length === 4) {
      handlePinVerify();
    }
  }, [pin]);

  const renderContent = () => (
    <div className="text-center">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Inserisci il PIN</h2>
      <p className={`h-10 flex items-center justify-center transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`}>
        {isLoading ? 'Verifica in corso...' : (error || 'Inserisci il tuo PIN di 4 cifre.')}
      </p>
      <PinInput pin={pin} onPinChange={setPin} />
      <div className="space-y-4 mt-4">
        <button
          onClick={() => setView('pin')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm"
        >
          <KeypadIcon className="w-5 h-5" />
          Accedi con PIN
        </button>
      </div>
    </div>
  );

  return <AuthLayout>{renderContent()}</AuthLayout>;
};

export default LoginScreen;
