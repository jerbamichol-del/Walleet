import React from 'react';
import { WalletIcon } from './icons/WalletIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface HeaderProps {
    pendingSyncs: number;
    isOnline: boolean;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ pendingSyncs, isOnline, onLogout }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <WalletIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800">
              Gestore Spese
            </h1>
        </div>
        <div className="flex items-center gap-4">
            {!isOnline && (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>Offline</span>
                </div>
            )}
            {pendingSyncs > 0 && (
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-full" title={`${pendingSyncs} immagini in attesa di analisi`}>
                    <PhotoIcon className="w-5 h-5" />
                    <span>{pendingSyncs}</span>
                </div>
            )}
            <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                aria-label="Logout"
                title="Logout"
            >
                <LockClosedIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;