import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  ShoppingBag,
  Wrench,
  Briefcase,
  Code,
  Users,
  Compass,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Listing, RequestItem } from '../types';
import { MAIN_CATEGORIES, LOCATIONS_DATA } from '../config/categories';
import { dbService } from '../services/dbService';
import { ListingCard } from '../components/ListingCard';
import { InteractiveMap } from '../components/InteractiveMap';

interface HomePageProps {
  onSelectTab: (tab: string) => void;
  onOpenDetails: (listing: Listing) => void;
  onOpenAdd: () => void;
  onOpenAI: () => void;
  onOpenAuth: () => void;
  onSearch: (query: string, location?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTab,
  onOpenDetails,
  onOpenAdd,
  onOpenAI,
  onOpenAuth,
  onSearch,
}) => {
  const { user, profile, t } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Bangladesh');
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedListings, fetchedRequests] = await Promise.all([
          dbService.getListings(),
          dbService.getRequests(),
        ]);
        setListings(fetchedListings);
        setRequests(fetchedRequests);
      } catch (err) {
        console.error('Failed to load initial discoveries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || selectedLocation !== 'All Bangladesh') {
      onSearch(searchQuery, selectedLocation === 'All Bangladesh' ? undefined : selectedLocation);
      onSelectTab('explore');
    }
  };

  // Real database-calculated stats for "Explore Nearby"
  const propertyCount = listings.filter((l) => l.type === 'property').length;
  const businessCount = listings.filter((l) => l.type === 'business').length;
  const serviceCount = listings.filter((l) => l.type === 'service').length;
  const productCount = listings.filter((l) => l.type === 'product').length;
  const jobCount = listings.filter((l) => l.type === 'job').length;
  const freelanceCount = listings.filter((l) => l.type === 'project').length;

  return (
    <div className="space-y-10 pb-16">
      {/* Safety Warning Banner */}
      <div className="bg-amber-500/10 border-y border-amber-500/20 py-2 px-4 text-center">
        <p className="text-xs text-amber-900 font-semibold flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t.safetyWarning}</span>
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-12 lg:p-16 shadow-2xl border border-slate-800">
          {/* Subtle glowing mesh */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              All-In-One Universal Discovery Platform
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              Find Everything. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                Connect Everyone.
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Explore interactive maps, discover properties, marketplace items, verified local technicians, doctors, freelance experts, and active jobs in one unified ecosystem.
            </p>

            {/* Universal Hero Search Form */}
            <form onSubmit={handleHeroSearch} className="mt-6 sm:mt-8 bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-3 gap-2 border-b sm:border-b-0 sm:border-r border-slate-200 py-1.5 sm:py-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full text-xs sm:text-sm text-slate-800 outline-hidden placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="flex items-center px-3 gap-2 py-1.5 sm:py-0 min-w-[180px]">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full text-xs sm:text-sm text-slate-700 outline-hidden bg-transparent font-medium cursor-pointer"
                >
                  <option value="All Bangladesh">All Bangladesh</option>
                  {LOCATIONS_DATA.map((loc) => (
                    <optgroup key={loc.division} label={loc.division}>
                      {loc.cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                <span>{t.searchBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Category Chips */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Popular:</span>
              {[
                { id: 'property', label: 'Properties' },
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'services', label: 'Technicians' },
                { id: 'professionals', label: 'Doctors' },
                { id: 'jobs', label: 'Jobs' },
                { id: 'freelance', label: 'Freelancers' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectTab(c.id)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-sm transition-all"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signature Section: Explore Nearby (Real Database Calculations) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              {t.exploreNearby}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live statistics and verified discoveries indexed from our real-time database.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('map')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Open Interactive Map <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              type: 'property',
              label: 'Properties',
              count: propertyCount,
              icon: Building,
              color: 'text-blue-600 bg-blue-50 border-blue-200',
            },
            {
              type: 'business',
              label: 'Businesses',
              count: businessCount,
              icon: Building,
              color: 'text-purple-600 bg-purple-50 border-purple-200',
            },
            {
              type: 'service',
              label: 'Services',
              count: serviceCount,
              icon: Wrench,
              color: 'text-amber-600 bg-amber-50 border-amber-200',
            },
            {
              type: 'product',
              label: 'Products',
              count: productCount,
              icon: ShoppingBag,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            },
            {
              type: 'job',
              label: 'Jobs Posted',
              count: jobCount,
              icon: Briefcase,
              color: 'text-rose-600 bg-rose-50 border-rose-200',
            },
            {
              type: 'project',
              label: 'Projects',
              count: freelanceCount,
              icon: Code,
              color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                onClick={() => onSelectTab(item.type === 'project' ? 'freelance' : item.type)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-2 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.count}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{item.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Map Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Interactive OpenStreetMap Discovery
              </h3>
              <p className="text-xs text-slate-500">
                Explore real pins for properties, clinics, hardware shops, jobs, and products.
              </p>
            </div>
            <button
              onClick={() => onSelectTab('map')}
              className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              Full Screen Map
            </button>
          </div>

          <InteractiveMap
            listings={listings}
            onSelectListing={onOpenDetails}
            height="420px"
          />
        </div>
      </section>

      {/* Recent / Featured Discoveries Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Featured Discoveries
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified properties, products, and services across Bangladesh.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('explore')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Explore All ({listings.length}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center">
            <Building className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-1" />
            <h3 className="text-base font-bold text-slate-800">{t.noListingsYet}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t.beTheFirst}
            </p>
            <button
              onClick={user ? onOpenAdd : onOpenAuth}
              className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              {t.createListing}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.slice(0, 8).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpenDetails={onOpenDetails}
                onRequireAuth={onOpenAuth}
              />
            ))}
          </div>
        )}
      </section>

      {/* "I Need" / Requests Board Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                Two-Sided Requests
              </span>
              <h3 className="text-xl sm:text-2xl font-black mt-2">
                "I Need" Request Board
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Can't find what you need? Post a request and verified providers will quote and respond.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={user ? onOpenAdd : onOpenAuth}
                className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all"
              >
                + Post What You Need
              </button>
              <button
                onClick={() => onSelectTab('requests')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
              >
                View Board ({requests.length})
              </button>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-8 text-slate-300 text-xs border border-white/10 rounded-2xl bg-white/5">
              No open requests right now. Be the first to post a request!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectTab('requests')}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 p-4 rounded-2xl transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                    <span className="font-bold">{req.category}</span>
                    {req.budget && <span className="font-extrabold text-white">৳{req.budget}</span>}
                  </div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{req.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">{req.description}</p>
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-300" />
                      {req.location}
                    </span>
                    <span className="text-teal-300 font-semibold">
                      {req.responsesCount} responses
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
