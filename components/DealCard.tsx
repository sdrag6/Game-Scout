import React from 'react';
import { Deal } from '../types';

interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const isMegaSale = deal.discountPercent >= 90;
  const isSale = deal.discountPercent > 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-skyrim-gold/10 ${
      isMegaSale 
        ? 'border-skyrim-accent bg-red-900/20' 
        : 'border-white/10 bg-white/5'
    }`}>
      {/* Background Decorator */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-skyrim-gold/5 blur-3xl"></div>

      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-skyrim-gold font-serif tracking-wide">{deal.store}</h3>
            <p className="text-sm text-gray-400">{deal.edition}</p>
          </div>
          {isSale && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isMegaSale ? 'bg-skyrim-accent text-white animate-pulse' : 'bg-green-600 text-white'
            }`}>
              -{deal.discountPercent}%
            </div>
          )}
        </div>

        <div className="flex items-end gap-3 mb-6">
          <span className="text-3xl font-bold text-white">{deal.currentPrice}</span>
          {isSale && (
            <span className="text-sm text-gray-500 line-through mb-1">{deal.originalPrice}</span>
          )}
        </div>

        <a 
          href={deal.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`block w-full py-2 text-center rounded-lg font-medium transition-colors ${
            isMegaSale 
              ? 'bg-skyrim-accent hover:bg-red-600 text-white' 
              : 'bg-white/10 hover:bg-white/20 text-skyrim-gold border border-skyrim-gold/30'
          }`}
        >
          {deal.url !== '#' ? 'View Deal' : 'Search Store'} <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-xs"></i>
        </a>
      </div>
      
      {isMegaSale && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-skyrim-accent to-transparent"></div>
      )}
    </div>
  );
};

export default DealCard;