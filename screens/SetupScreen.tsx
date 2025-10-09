import React, { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SetupScreenProps {
  onSetupComplete: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pinHash, setPinHash] = useLocalStorage('pinHash', '');
  const [pinSalt, setPinSalt] = useLocalStorage('pinSalt', '');

  const handleSavePin = async () => {
    if (pin.length !== 4 || pinConfirm.length !== 4) {
      setError('Inserisci un PIN di 4 cifre.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('I PIN non coincidono.');
      return;
    }

    try {
      const { hash, salt } = await import('../utils/auth').then(mod => mod.hashPinWithSalt(pin));
      setPinHash(hash);
      setPinSalt(salt);
      onSetupComplete();
    } catch (e) {
      console.error('Errore nel salvataggio del PIN', e);
      setError('Impossibile salvare il PIN.');
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Imposta il tuo PIN</h2>
        <p className={`h-10 flex items-center justify-center text-sm text-red-500 ${error ? 'visible' : 'invisible'}`}>
          {error || ' '}
        </p>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-1">PIN</h3>
          <PinInput pin={pin} onPinChange={setPin} />
        </div>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-1">Conferma PIN</h3>
          <PinInput pin={pinConfirm} onPinChange={setPinConfirm} />
        </div>
        <button
          onClick={handleSavePin}
          className="w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Salva PIN
        </button>
      </div>
    </AuthLayout>
  );
};

export default SetupScreen;
