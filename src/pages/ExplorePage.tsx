import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Map as MapIcon,
  Grid,
  SlidersHorizontal,
  X,
  Building,
  RotateCcw,
} from 'lucide-react';
import { Listing, ListingType } from '../types';
import { dbService } from '../services/dbService';
import { ListingCard } from '../components/ListingCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { MAIN_CATEGORIES, LOCATIONS_DATA } from '../config/categories';

interface ExplorePageProps {
  initialType?: string;
  initialQuery?: string;
  initialLocation?: string;
  onOpenDetails: (listing: Listing) => void;
  onOpenAuth: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialType = 'all',
  initialQuery = '',
  initialLocation = '',
  onOpenDetails,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await dbService.getListings(
        activeTab === 'all' ? undefined : activeTab,
        selectedCategory === 'all' ? undefined : selectedCategory,
        selectedLocation || undefined
      );
      setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab, selectedCategory, selectedLocation]);

  // Client-side text & price filtering
  const filteredListings = listings.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchLoc = item.location.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchLoc) return false;
    }
    if (priceMin !== '' && item.price < Number(priceMin)) return false;
    if (priceMax !== '' && item.price > Number(priceMax)) return false;
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedCategory('all');
    setPriceMin('');
    setPriceMax('');
    setActiveTab('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Universal Discovery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover real properties, products, businesses, services, and opportunities.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
              showFilters
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Search Input */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, titles, professions, or items..."
            className="w-full text-xs text-slate-800 outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center px-3 gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 py-1.5 sm:py-0">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <input
            type="text"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            placeholder="City, area or neighborhood..."
            className="w-full sm:w-48 text-xs text-slate-700 outline-hidden font-medium"
          />
        </div>

        {searchQuery || selectedLocation || selectedCategory !== 'all' ? (
          <button
            type="button"
            onClick={resetFilters}
            className="p-2 text-slate-400 hover:text-slate-700 self-center"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Discovery Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'property', label: 'Properties' },
          { id: 'product', label: 'Products' },
          { id: 'service', label: 'Services' },
          { id: 'business', label: 'Businesses' },
          { id: 'job', label: 'Jobs' },
          { id: 'project', label: 'Freelance' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showFilters && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2 duration-150 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden"
              >
                <option value="all">All Categories</option>
                {MAIN_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.bnName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Min Price (৳)</label>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Max Price (৳)</label>
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full p-2 text-xs border border-slate-300 rounded-xl bg-white outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching discoveries found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, location filters, or category tab.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-3">
            Showing {filteredListings.length} verified discoveries
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpenDetails={onOpenDetails}
                onRequireAuth={onOpenAuth}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InteractiveMap
            listings={filteredListings}
            onSelectListing={onOpenDetails}
            height="600px"
          />
        </div>
      )}
    </div>
  );
};
