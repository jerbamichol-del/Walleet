import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { hashPinWithSalt, isBiometricsSupported, registerBiometrics } from '../utils/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { FingerprintIcon } from '../components/icons/FingerprintIcon';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';

interface SetupScreenProps {
  onSetupSuccess: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupSuccess }) => {
  const [step, setStep] = useState<'welcome' | 'pin_setup' | 'pin_confirm' | 'biometric_setup'>('welcome');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setPinHash] = useLocalStorage('pinHash', '');
  const [, setPinSalt] = useLocalStorage('pinSalt', '');
  const [, setBiometricsEnabled] = useLocalStorage('biometricsEnabled', false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    isBiometricsSupported().then(setBiometricsAvailable);
  }, []);
  
  const handlePinSet = async () => {
    const { hash, salt } = await hashPinWithSalt(pin);
    setPinHash(hash);
    setPinSalt(salt);
    if (biometricsAvailable) {
      setStep('biometric_setup');
    } else {
      onSetupSuccess();
    }
  };
  
  useEffect(() => {
    if (step === 'pin_setup' && pin.length === 4) {
      setStep('pin_confirm');
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === 'pin_confirm' && confirmPin.length === 4) {
      if (pin === confirmPin) {
        setError(null);
        handlePinSet();
      } else {
        setError('I PIN non corrispondono. Riprova.');
        setTimeout(() => {
            setPin('');
            setConfirmPin('');
            setError(null);
            setStep('pin_setup');
        }, 1500);
      }
    }
  }, [confirmPin, pin, step]);

  const handleEnableBiometrics = async () => {
    if (!isOnline) {
      setError("Devi essere online per configurare l'accesso con impronta.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
        await registerBiometrics();
        setBiometricsEnabled(true);
        onSetupSuccess();
    } catch (err: any) {
        console.error(err);
        let message = "Configurazione biometrica non riuscita.";
        if (err.name === 'NotAllowedError') {
            message = "Registrazione annullata dall'utente.";
        } else if (err.name === 'SecurityError' || err.message.includes('Permissions Policy')) {
            message = "Errore di permessi. Ricarica l'app e riprova.";
        }
        setError(message);
        // La biometria non è stata abilitata, ma il setup va completato comunque.
        setBiometricsEnabled(false);
        setTimeout(onSetupSuccess, 2000); 
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSkipBiometrics = () => {
    setBiometricsEnabled(false);
    onSetupSuccess();
  }

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Benvenuto!</h2>
            <p className="text-slate-500 mb-6">Proteggiamo le tue spese con un accesso sicuro.</p>
            <button
              onClick={() => setStep('pin_setup')}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Inizia Configurazione
            </button>
          </div>
        );
        
      case 'pin_setup':
      case 'pin_confirm':
        const isConfirming = step === 'pin_confirm';
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">{isConfirming ? 'Conferma il tuo PIN' : 'Crea un PIN di 4 cifre'}</h2>
            <p className={`text-slate-500 h-10 flex items-center justify-center transition-colors ${error ? 'text-red-500' : ''}`}>
                {error || (isConfirming ? 'Inseriscilo di nuovo per conferma.' : 'Servirà come metodo di accesso principale o di recupero.')}
            </p>
            <PinInput 
                pin={isConfirming ? confirmPin : pin} 
                onPinChange={isConfirming ? setConfirmPin : setPin} 
            />
          </div>
        );
      
      case 'biometric_setup':
        return (
          <div className="text-center">
            <FingerprintIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Accesso Veloce</h2>
            <p className={`h-12 flex items-center justify-center text-slate-500 mb-6 transition-colors ${error ? 'text-red-500' : ''}`}>
                {isLoading ? 'Attendi...' : error || 'Vuoi usare la tua impronta digitale per accedere più rapidamente?'}
            </p>
             {!isOnline && (
                <p className="text-sm text-amber-600 -mt-4 mb-4">
                    Funzionalità non disponibile offline.
                </p>
            )}
            <div className="space-y-4">
                <button
                    onClick={handleEnableBiometrics}
                    disabled={isLoading || !isOnline}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <FingerprintIcon className="w-5 h-5" />}
                    Abilita Impronta
                </button>
                <button
                    onClick={handleSkipBiometrics}
                    disabled={isLoading}
                    className="w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                >
                    Salta per ora
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <AuthLayout>{renderContent()}</AuthLayout>
    </>
  );
};

export default SetupScreen;