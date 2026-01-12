import React, { useState, useEffect } from 'react';
import { checkGamePrices } from './services/geminiService';
import { Deal } from './types';
import DealCard from './components/DealCard';
import NotificationRequest from './components/NotificationRequest';
import LoadingState from './components/LoadingState';

const App: React.FC = () => {
  const [gameTitle, setGameTitle] = useState<string>('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [summary, setSummary] = useState<string>('');
  const [searchedGame, setSearchedGame] = useState<string>('');

  const fetchPrices = async (findFreeKeys: boolean = false, overrideTitle?: string) => {
    // Determine the title to use (override or state)
    const currentTitle = overrideTitle !== undefined ? overrideTitle : gameTitle;
    
    // Only block standard price check if title is empty. Free key hunt allows empty title (global search).
    if (!findFreeKeys && !currentTitle.trim()) return;
    
    setLoading(true);
    setError(null);
    
    // If empty title and free keys, we are searching for "Trending Free Games"
    const displayTitle = !currentTitle.trim() && findFreeKeys ? "All Trending Free Games" : currentTitle;
    setSearchedGame(displayTitle);
    
    try {
      const result = await checkGamePrices(currentTitle, findFreeKeys);
      setDeals(result.deals);
      setSummary(result.summary);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("Unable to retrieve market data at this time. Please try again later. (Ensure valid API Key is set)");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (title: string) => {
    setGameTitle(title);
    fetchPrices(false, title);
  };

  // Initial load simulation or actual check - optional to run on mount
  useEffect(() => {
    // We don't auto-fetch immediately on mount to save tokens in this demo
  }, []);

  const hasMegaSale = deals.some(d => d.discountPercent >= 90);
  const isFreeKeySearch = summary.toLowerCase().includes('free') || deals.some(d => d.currentPrice === 'Free' || d.currentPrice === '$0.00');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-skyrim-gold selection:text-black">
      
      {/* Header / Hero */}
      <header className="relative py-16 md:py-24 flex items-center justify-center overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
           {/* Fallback pattern if image fails or for overlay effect */}
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-10"></div>
           <div className="absolute inset-0 bg-black/60 z-0"></div>
           <img 
             src="https://picsum.photos/1920/1080?grayscale&blur=2" 
             alt="Background" 
             className="w-full h-full object-cover opacity-40"
           />
        </div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto w-full">
          <div className="mb-4 inline-block px-4 py-1 rounded-full border border-skyrim-gold/30 bg-black/50 backdrop-blur-md text-skyrim-gold text-sm tracking-widest uppercase">
            Global Market Tracker
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-xl">
            Game Scout
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8 font-light">
            Track prices for <span className="text-skyrim-gold font-bold">any game</span> across major stores, or hunt specifically for <span className="text-skyrim-accent font-bold">free steam keys</span> and giveaways.
          </p>
          
          {/* Search Bar Container */}
          <div className="max-w-xl mx-auto bg-black/40 backdrop-blur-sm p-2 rounded-2xl border border-white/10 shadow-2xl">
            <div className="relative mb-3">
              <i className="fa-solid fa-gamepad absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
              <input 
                type="text" 
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                placeholder="Enter game title (e.g. Cyberpunk 2077)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-skyrim-gold focus:ring-1 focus:ring-skyrim-gold transition-all"
                onKeyDown={(e) => e.key === 'Enter' && fetchPrices(false)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => fetchPrices(false)}
                disabled={loading || !gameTitle}
                className="flex items-center justify-center gap-2 py-3 px-4 font-bold text-black bg-skyrim-gold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scanning...' : 'Check Prices'}
              </button>
              
              <button 
                onClick={() => fetchPrices(true)}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 font-bold text-white bg-skyrim-accent/80 border border-skyrim-accent rounded-lg hover:bg-red-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <i className="fa-solid fa-gift"></i> {gameTitle ? 'Hunt Free Keys' : 'Hunt ALL Freebies'}
              </button>
            </div>
            
            {/* Quick Search Pills */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
               <span className="text-xs text-gray-400 uppercase tracking-wider self-center mr-1">Trending:</span>
               <button onClick={() => handleQuickSearch('Elden Ring')} className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-skyrim-gold hover:text-black transition-colors border border-white/10">Elden Ring</button>
               <button onClick={() => handleQuickSearch('Cyberpunk 2077')} className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-skyrim-gold hover:text-black transition-colors border border-white/10">Cyberpunk 2077</button>
               <button onClick={() => handleQuickSearch('Baldur\'s Gate 3')} className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-skyrim-gold hover:text-black transition-colors border border-white/10">Baldur's Gate 3</button>
               <button onClick={() => handleQuickSearch('Grand Theft Auto V')} className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-skyrim-gold hover:text-black transition-colors border border-white/10">GTA V</button>
               <button onClick={() => handleQuickSearch('The Elder Scrolls Online DLC')} className="text-xs px-3 py-1 rounded-full bg-white/5 hover:bg-skyrim-gold hover:text-black transition-colors border border-white/10">ESO DLCs</button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Status Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 md:mb-0">
            <span className={`w-2 h-2 rounded-full animate-pulse ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            {loading ? 'Agents Searching...' : `Results for: ${searchedGame || 'Waiting for input'}`}
          </div>
          <div className="text-sm text-gray-500 font-mono">
            Last Updated: <span className="text-skyrim-silver">{lastUpdated}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 flex items-center gap-3">
             <i className="fa-solid fa-triangle-exclamation"></i>
             {error}
          </div>
        )}

        {/* Mega Sale / Free Alert Banner */}
        {hasMegaSale && (
          <div className="mb-12 bg-skyrim-accent/20 border-2 border-skyrim-accent rounded-xl p-6 flex items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse-slow">
            <div className="flex items-center gap-4">
              <div className="bg-skyrim-accent text-white p-3 rounded-full">
                <i className={`fa-solid ${isFreeKeySearch ? 'fa-gift' : 'fa-fire'} text-xl`}></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {isFreeKeySearch ? 'FREE KEY FOUND!' : '90%+ SALE DETECTED!'}
                </h3>
                <p className="text-red-200">
                  {isFreeKeySearch ? 'A giveaway or 100% discount is active.' : 'Incredible savings have been detected.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <LoadingState />
        ) : (
          <>
            {summary && (
              <div className="mb-8 p-4 bg-white/5 border-l-4 border-skyrim-gold rounded-r-lg text-gray-300 italic">
                "{summary}"
              </div>
            )}
            
            {deals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
               !loading && lastUpdated !== 'Never' && !error && (
                 <div className="text-center py-20 text-gray-500">
                   <i className="fa-solid fa-ghost text-4xl mb-4 opacity-50"></i>
                   <p>No pricing data found. Try checking again or check the spelling.</p>
                 </div>
               )
            )}
            
            {/* If no data yet (initial state) */}
            {deals.length === 0 && lastUpdated === 'Never' && !loading && (
              <div className="text-center py-20">
                <div className="inline-block p-6 rounded-full bg-white/5 mb-6">
                   <i className="fa-solid fa-magnifying-glass-chart text-4xl text-skyrim-gold"></i>
                </div>
                <h3 className="text-2xl text-white font-serif mb-2">Ready to Scan</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Enter a game title above and choose to check standard prices or hunt for elusive free keys.
                </p>
              </div>
            )}
          </>
        )}

        {/* Subscription / Notifications */}
        <NotificationRequest />

      </main>

      <footer className="border-t border-white/10 bg-black py-8 mt-12 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Game Scout. Not affiliated with any game store.</p>
        <p className="mt-2 text-xs">Powered by Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;