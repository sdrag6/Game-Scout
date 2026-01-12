import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-t-4 border-skyrim-gold rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-4 border-skyrim-silver rounded-full animate-spin animation-delay-150"></div>
        <div className="absolute inset-4 border-b-4 border-skyrim-accent rounded-full animate-spin animation-delay-300"></div>
      </div>
      <p className="text-skyrim-gold font-serif text-lg animate-pulse-slow">Scanning global digital stores...</p>
    </div>
  );
};

export default LoadingState;