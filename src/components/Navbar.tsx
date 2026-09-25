import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Sparkles,
  Plus,
  Globe,
  User,
  LogOut,
  Settings,
  Shield,
  LayoutDashboard,
  Menu,
  X,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpenAdd: () => void;
  onOpenAI: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onSearchSubmit: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  onOpenAdd,
  onOpenAI,
  onOpenMessages,
  onOpenNotifications,
  onSearchSubmit,
}) => {
  const { user, profile, signOutUser, language, setLanguage, t, isAdmin } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = dbService.subscribeNotifications(user.uid, (notifs) => {
      setUnreadNotifsCount(notifs.filter((n) => !n.read).length);
    });
    return () => unsub();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearchSubmit(searchVal.trim());
    }
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore' },
    { id: 'map', label: 'Map' },
    { id: 'property', label: t.property },
    { id: 'marketplace', label: t.marketplace },
    { id: 'services', label: t.services },
    { id: 'jobs', label: t.jobs },
    { id: 'freelance', label: t.freelance },
    { id: 'community', label: t.communities },
    { id: 'requests', label: t.iNeed },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                FX
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Find<span className="text-blue-600">X</span>
                </span>
                <span className="hidden lg:block text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                  Find Everything. Connect Everyone.
                </span>
              </div>
            </button>

            {/* Universal Search bar for desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative w-72 lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 rounded-full border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
              />
            </form>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Gemini AI Studio Hub Button */}
            <button
              type="button"
              onClick={onOpenAI}
              title="FindX Gemini AI Hub (Grounding, Vision, Voice)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">AI Hub</span>
            </button>

            {/* Language Toggle (EN / BN) */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              title="Change Language (বাংলা / English)"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[11px] uppercase">{language}</span>
            </button>

            {/* Authenticated Controls */}
            {user ? (
              <>
                {/* Messages */}
                <button
                  type="button"
                  onClick={onOpenMessages}
                  title="Messages"
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  title="Notifications"
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </button>

                {/* Universal "+ Add" Button */}
                <button
                  type="button"
                  onClick={onOpenAdd}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </button>

                {/* User Avatar Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1 p-0.5 rounded-full border border-slate-200 hover:border-blue-500 transition-colors"
                  >
                    <img
                      src={
                        profile?.photoURL ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`
                      }
                      alt={profile?.fullName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <ChevronDown className="w-3 h-3 text-slate-500 mr-1 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{profile?.fullName}</p>
                        <p className="text-[11px] text-blue-600 font-medium truncate">@{profile?.username}</p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectTab(`profile_${profile?.username}`);
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        My Profile Card
                      </button>

                      <button
                        onClick={() => {
                          onSelectTab('dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        Dashboard
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onSelectTab('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                        >
                          <Shield className="w-3.5 h-3.5 text-indigo-600" />
                          Admin Hub
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          signOutUser();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Nav Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navLinks.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-2">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 text-xs rounded-xl outline-hidden"
              />
            </form>
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    currentTab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
