
import React from 'react';
import { Search, Bell, Moon, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center overflow-hidden shadow-lg shadow-green-500/20">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-black" fill="currentColor">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.09-4-4L2 15.6l1.5 2.89z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">EliteAlgoX</h1>
          <p className="text-[10px] text-zinc-500 font-medium">Happy Holidays</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-zinc-400">
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <Search size={20} />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <Moon size={20} />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
