import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import App from './App';
import LoginScreen from './screens/LoginScreen';
import SetupScreen from './screens/SetupScreen';

const AuthGate: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>('isSetupComplete', false);
  // Using session state for authentication status. This will reset on browser close.
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    if (!isSetupComplete) {
      setIsSetupComplete(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <App onLogout={handleLogout} />;
  }

  if (isSetupComplete) {
    return <LoginScreen onLoginSuccess={handleAuthSuccess} />;
  }

  return <SetupScreen onSetupSuccess={handleAuthSuccess} />;
};

export default AuthGate;