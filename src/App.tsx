import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { AuthModal } from './components/AuthModal';
import { AddListingModal } from './components/AddListingModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ChatDrawer } from './components/ChatDrawer';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CommunityPage } from './pages/CommunityPage';
import { RequestsPage } from './pages/RequestsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { InteractiveMap } from './components/InteractiveMap';
import { Listing } from './types';
import { dbService } from './services/dbService';

function MainApp() {
  const { user, profile } = useAuth();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [targetProfileUsername, setTargetProfileUsername] = useState<string | undefined>(undefined);
  const [searchFilterQuery, setSearchFilterQuery] = useState<string>('');
  const [searchFilterLocation, setSearchFilterLocation] = useState<string>('');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'signup'>('login');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState<{
    uid: string;
    fullName: string;
    username: string;
    photoURL?: string;
  } | null>(null);
  const [chatListingContext, setChatListingContext] = useState<{ id: string; title: string } | null>(null);
  const [notifsDrawerOpen, setNotifsDrawerOpen] = useState(false);

  // Map full screen listings
  const [mapListings, setMapListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (currentTab === 'map') {
      dbService.getListings().then(setMapListings);
    }
  }, [currentTab]);

  // Handle URL hash or tab selection
  const handleSelectTab = (tab: string) => {
    if (tab.startsWith('profile_')) {
      const username = tab.replace('profile_', '');
      setTargetProfileUsername(username);
      setCurrentTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthDefaultMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenDetails = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactFromListing = (listing: Listing) => {
    setChatTargetUser({
      uid: listing.userId,
      fullName: listing.userFullName,
      username: listing.userUsername,
      photoURL: listing.userPhoto,
    });
    setChatListingContext({
      id: listing.id,
      title: listing.title,
    });
    setChatDrawerOpen(true);
  };

  const handleContactUser = (target: {
    uid: string;
    fullName: string;
    username: string;
    photoURL?: string;
  }) => {
    setChatTargetUser(target);
    setChatListingContext(null);
    setChatDrawerOpen(true);
  };

  const handleSearchSubmit = (query: string, loc?: string) => {
    setSearchFilterQuery(query);
    if (loc) setSearchFilterLocation(loc);
    setCurrentTab('explore');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={handleOpenAuth}
        onOpenAdd={() => setAddModalOpen(true)}
        onOpenAI={() => setAiModalOpen(true)}
        onOpenMessages={() => {
          setChatTargetUser(null);
          setChatListingContext(null);
          setChatDrawerOpen(true);
        }}
        onOpenNotifications={() => setNotifsDrawerOpen(true)}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16 md:pb-6">
        {currentTab === 'home' && (
          <HomePage
            onSelectTab={handleSelectTab}
            onOpenDetails={handleOpenDetails}
            onOpenAdd={() => setAddModalOpen(true)}
            onOpenAI={() => setAiModalOpen(true)}
            onOpenAuth={() => handleOpenAuth('login')}
            onSearch={handleSearchSubmit}
          />
        )}

        {currentTab === 'map' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Interactive OpenStreetMap</h1>
                <p className="text-xs text-slate-500">
                  Real-time geographic markers for properties, local technicians, clinics, and jobs.
                </p>
              </div>
            </div>
            <InteractiveMap
              listings={mapListings}
              onSelectListing={handleOpenDetails}
              height="75vh"
            />
          </div>
        )}

        {currentTab === 'explore' && (
          <ExplorePage
            initialType="all"
            initialQuery={searchFilterQuery}
            initialLocation={searchFilterLocation}
            onOpenDetails={handleOpenDetails}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {['property', 'marketplace', 'services', 'professionals', 'jobs', 'freelance'].includes(
          currentTab
        ) && (
          <ExplorePage
            initialType={
              currentTab === 'freelance'
                ? 'project'
                : currentTab === 'professionals'
                ? 'service'
                : currentTab
            }
            onOpenDetails={handleOpenDetails}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'detail' && selectedListing && (
          <ListingDetailPage
            listing={selectedListing}
            onBack={() => setCurrentTab('home')}
            onOpenAuth={() => handleOpenAuth('login')}
            onContactOwner={handleContactFromListing}
            onNavigateToUser={(uname) => {
              setTargetProfileUsername(uname);
              setCurrentTab('profile');
            }}
          />
        )}

        {currentTab === 'community' && (
          <CommunityPage
            onOpenAuth={() => handleOpenAuth('login')}
            onOpenAdd={() => setAddModalOpen(true)}
          />
        )}

        {currentTab === 'requests' && (
          <RequestsPage
            onOpenAuth={() => handleOpenAuth('login')}
            onOpenAdd={() => setAddModalOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            targetUsername={targetProfileUsername}
            onOpenDetails={handleOpenDetails}
            onOpenAuth={() => handleOpenAuth('login')}
            onContactUser={handleContactUser}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onOpenDetails={handleOpenDetails}
            onOpenAdd={() => setAddModalOpen(true)}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                FX
              </div>
              <span className="text-white font-bold text-sm">
                Find<span className="text-blue-500">X</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">Find Everything. Connect Everyone.</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Verified Data Policy</span>
              <span>OpenStreetMap Engine</span>
              <span>Gemini Grounding</span>
              <span>© {new Date().getFullYear()} FindX</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAdd={() => setAddModalOpen(true)}
        onOpenMessages={() => {
          setChatTargetUser(null);
          setChatListingContext(null);
          setChatDrawerOpen(true);
        }}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authDefaultMode}
      />

      <AddListingModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={() => {
          if (currentTab === 'map') {
            dbService.getListings().then(setMapListings);
          }
        }}
      />

      <GeminiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      <ChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => {
          setChatDrawerOpen(false);
          setChatTargetUser(null);
          setChatListingContext(null);
        }}
        targetUser={chatTargetUser}
        listingContext={chatListingContext}
      />

      <NotificationsDrawer
        isOpen={notifsDrawerOpen}
        onClose={() => setNotifsDrawerOpen(false)}
        onNavigate={(link) => {
          if (link.startsWith('/@')) {
            const username = link.replace('/@', '');
            setTargetProfileUsername(username);
            setCurrentTab('profile');
          } else if (link === '/messages') {
            setChatDrawerOpen(true);
          } else if (link === '/community') {
            setCurrentTab('community');
          } else if (link === '/dashboard') {
            setCurrentTab('dashboard');
          } else if (link === '/requests') {
            setCurrentTab('requests');
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
