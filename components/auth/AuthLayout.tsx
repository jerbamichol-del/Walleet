import React from 'react';
import { WalletIcon } from '../icons/WalletIcon';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
             <WalletIcon className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">
            Gestore Spese
          </h1>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in-up">
            {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;