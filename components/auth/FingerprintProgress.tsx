import React from 'react';
// import { FingerprintIcon } from '../icons/FingerprintIcon';

// interface FingerprintProgressProps {
  scanCount: number;
  totalScans?: number;
  isError?: boolean;
}

// const FingerprintProgress: React.FC<FingerprintProgressProps> = ({ scanCount, totalScans = 3, isError = false }) => {
  const progressPercentage = (scanCount / totalScans) * 100;
  
  const baseColor = isError ? 'text-red-300' : 'text-slate-200';
  const progressColor = isError ? 'text-red-500' : 'text-indigo-600';

  return (
    <div className="relative w-40 h-40 mx-auto">
//       <FingerprintIcon className={`absolute inset-0 w-full h-full ${baseColor}`} />
      <div
        className="absolute inset-0 w-full h-full overflow-hidden transition-all duration-500"
        style={{ clipPath: `inset(${100 - progressPercentage}% 0 0 0)` }}
      >
//         <FingerprintIcon className={`w-full h-full ${progressColor}`} />
      </div>
    </div>
  );
};

// export default FingerprintProgress;