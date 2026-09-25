import React from 'react';
import { Home, Map, Compass, PlusCircle, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAdd: () => void;
  onOpenMessages: () => void;
  onOpenAuth: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAdd,
  onOpenMessages,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition-colors ${
            currentTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition-colors ${
            currentTab === 'map' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Map className="w-5 h-5" />
          <span>Map</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('explore')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition-colors ${
            currentTab === 'explore' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </button>

        <button
          type="button"
          onClick={user ? onOpenAdd : onOpenAuth}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold text-blue-600 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="font-extrabold">Add</span>
        </button>

        <button
          type="button"
          onClick={user ? onOpenMessages : onOpenAuth}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (user && profile) {
              onSelectTab(`profile_${profile.username}`);
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold transition-colors ${
            currentTab.startsWith('profile') ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>
    </div>
  );
};
