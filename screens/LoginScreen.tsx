import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PinInput from '../components/auth/PinInput';
import { FingerprintIcon } from '../components/icons/FingerprintIcon';
import { KeypadIcon } from '../components/icons/KeypadIcon';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { authenticateBiometrics, verifyPin, isBiometricsSupported, resetBiometrics } from '../utils/auth';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'choice' | 'pin' | 'authenticating'>('choice');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pinHash] = useLocalStorage('pinHash', '');
  const [pinSalt] = useLocalStorage('pinSalt', '');
  const [biometricsEnabled] = useLocalStorage('biometricsEnabled', false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const isOnline = useOnlineStatus();
  
  useEffect(() => {
    isBiometricsSupported().then(supported => {
        setBiometricsAvailable(supported);
    });
  }, []);

  const handleReset = async () => {
    // Cancella le credenziali biometriche da IndexedDB
    await resetBiometrics();
    // Cancella tutti gli elementi di localStorage relativi alla sicurezza
    localStorage.removeItem('isSetupComplete');
    localStorage.removeItem('pinHash');
    localStorage.removeItem('pinSalt');
    localStorage.removeItem('biometricsEnabled');
    // Ricarica l'app per far ripartire AuthGate da zero
    window.location.reload();
  };

  const handleBiometricAuth = async () => {
    if (!isOnline) {
        setError("L'accesso con impronta è disponibile solo online.");
        return;
    }
    setView('authenticating');
    setError(null);
    try {
      await authenticateBiometrics();
      onLoginSuccess();
    } catch (e: any) {
      console.error(e);
      let errorMessage = 'Errore imprevisto. Riprova o usa il PIN.';
      if (e.name === 'NotAllowedError' || e.message.includes("cancelled")) {
          errorMessage = "Autenticazione annullata.";
      } else if (e.name === 'SecurityError' || e.message.includes('Permissions Policy')) {
          errorMessage = "Errore di sicurezza. L'ambiente non supporta questa funzione.";
      } else if (e.message.includes("Nessuna credenziale biometrica registrata")) {
          errorMessage = "Nessuna impronta configurata per questa app. Usa il PIN.";
      }
      setError(errorMessage);
      setView('choice'); 
    }
  };

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

  const showBiometricsButton = isOnline && biometricsAvailable && biometricsEnabled;

  const renderContent = () => {
    switch (view) {
      case 'authenticating':
        return (
          <div className="text-center flex flex-col items-center justify-center min-h-[340px]">
            <SpinnerIcon className="w-12 h-12 text-indigo-600 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">In attesa...</h2>
            <p className="text-slate-500">Usa il sensore del tuo dispositivo per continuare.</p>
          </div>
        );

      case 'pin':
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Inserisci il PIN</h2>
            <p className={`h-10 flex items-center justify-center transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`}>
              {isLoading ? 'Verifica in corso...' : (error || 'Inserisci il tuo PIN di 4 cifre.')}
            </p>
            <PinInput pin={pin} onPinChange={setPin} />
            {showBiometricsButton && (
              <button onClick={() => setView('choice')} className="mt-4 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Usa l'impronta
              </button>
            )}
          </div>
        );

      case 'choice':
      default:
        return (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Accedi</h2>
            <p className="text-slate-500 mb-8">Scegli il tuo metodo di accesso.</p>
            
            {!isOnline && biometricsEnabled && (
                <div className="text-sm text-amber-700 bg-amber-100 p-3 rounded-md mb-4 border border-amber-200">
                    Sei offline. L'accesso con impronta non è disponibile. Usa il PIN per continuare.
                </div>
            )}

            <div className="space-y-4">
              {showBiometricsButton && (
                <button
                  onClick={handleBiometricAuth}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  <FingerprintIcon className="w-5 h-5" />
                  Accedi con Impronta
                </button>
              )}
              <button
                onClick={() => setView('pin')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                <KeypadIcon className="w-5 h-5" />
                Accedi con PIN
              </button>
            </div>
             {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
             <div className="mt-8 text-center">
                <button onClick={handleReset} className="text-xs text-slate-500 hover:text-indigo-600 hover:underline">
                    Problemi di accesso? Reimposta
                </button>
             </div>
          </div>
        );
    }
  };

  return <AuthLayout>{renderContent()}</AuthLayout>;
};

export default LoginScreen;