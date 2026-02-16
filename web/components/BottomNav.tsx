
import React from 'react';
import { Home, TrendingUp, Users, Wallet, User, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { name: 'Home', icon: Home },
    { name: 'Trade', icon: TrendingUp },
    { name: 'Copy', icon: Users },
    { name: 'Wallet', icon: Wallet },
    { name: 'Profile', icon: User },
    { name: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[768px] bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 px-2 py-3 z-50 flex items-center justify-around pb-6 sm:pb-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name;
        return (
          <button
            key={tab.name}
            onClick={() => onTabChange(tab.name)}
            className="flex flex-col items-center gap-1 group relative flex-1"
          >
            {isActive && (
              <div className="absolute -top-3 w-12 h-12 bg-green-500/20 blur-xl rounded-full" />
            )}
            <Icon 
              size={20} 
              className={`transition-all duration-300 ${isActive ? 'text-green-500 scale-110' : 'text-zinc-500 group-hover:text-zinc-300'}`} 
            />
            <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-green-500' : 'text-zinc-500'}`}>
              {tab.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
