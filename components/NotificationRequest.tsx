import React, { useState } from 'react';

const NotificationRequest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In a real app, send to backend. Here we simulate.
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-skyrim-slate to-black border border-white/10 text-center relative overflow-hidden">
      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-skyrim-gold/10 mb-6">
          <i className="fa-regular fa-bell text-2xl text-skyrim-gold"></i>
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">Never Miss a 90% Drop</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          We scan the markets daily. Sign up to get an instant email alert when your wishlist games hit rock bottom prices.
        </p>

        {subscribed ? (
          <div className="animate-in fade-in zoom-in duration-300 text-green-400 font-medium bg-green-400/10 py-3 px-6 rounded-lg inline-block">
            <i className="fa-solid fa-check-circle mr-2"></i> You're on the list!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex gap-2">
            <input 
              type="email" 
              placeholder="gamer@example.com" 
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-skyrim-gold transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="bg-skyrim-gold text-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-500 transition-colors whitespace-nowrap"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
      
      {/* Decorative bg elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
    </div>
  );
};

export default NotificationRequest;