import React, { useState } from 'react';
import {
  Heart,
  MapPin,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare,
  Bed,
  Bath,
  Maximize2,
  Briefcase,
  Clock,
  Share2,
} from 'lucide-react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';

interface ListingCardProps {
  listing: Listing;
  onOpenDetails: (listing: Listing) => void;
  onContact?: (listing: Listing) => void;
  onRequireAuth?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onOpenDetails,
  onContact,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(listing.savesCount || 0);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const saved = await dbService.toggleSaveListing(user.uid, listing.id);
    setIsSaved(saved);
    setSavesCount((prev) => (saved ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user && onRequireAuth) {
      onRequireAuth();
      return;
    }
    if (onContact) onContact(listing);
  };

  const typeColorMap: Record<string, string> = {
    property: 'bg-blue-50 text-blue-700 border-blue-200',
    product: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    service: 'bg-amber-50 text-amber-700 border-amber-200',
    business: 'bg-purple-50 text-purple-700 border-purple-200',
    job: 'bg-rose-50 text-rose-700 border-rose-200',
    project: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  const fallbackImage =
    listing.type === 'property'
      ? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80'
      : listing.type === 'product'
      ? 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
      : listing.type === 'service'
      ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'
      : listing.type === 'business'
      ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
      : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80';

  const displayImage = listing.images?.[0] || fallbackImage;

  return (
    <div
      onClick={() => onOpenDetails(listing)}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Type & Category Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-xs ${
              typeColorMap[listing.type] || 'bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            {listing.type}
          </span>
          {listing.userVerified && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-600/90 text-white backdrop-blur-md shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-white" />
              Verified
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleToggleSave}
          title={isSaved ? 'Remove from saved' : 'Save listing'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md ${
            isSaved
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 hover:bg-white text-slate-700 hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Price Tag Overlay on bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white drop-shadow-md">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black tracking-tight">
              {listing.currency || '৳'}
              {listing.price.toLocaleString()}
            </span>
            {listing.priceUnit && (
              <span className="text-xs font-medium text-slate-200">{listing.priceUnit}</span>
            )}
          </div>
          {listing.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{listing.rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-300 font-normal">({listing.reviewsCount})</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-1">
            {listing.category} {listing.subcategory ? `• ${listing.subcategory}` : ''}
          </div>

          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm md:text-base">
            {listing.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {listing.description}
          </p>

          {/* Subtype Quick Pills */}
          {listing.propertyDetails && (
            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
              {listing.propertyDetails.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-slate-400" />
                  {listing.propertyDetails.bedrooms} Bed
                </span>
              )}
              {listing.propertyDetails.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" />
                  {listing.propertyDetails.bathrooms} Bath
                </span>
              )}
              {listing.propertyDetails.areaSqFt && (
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  {listing.propertyDetails.areaSqFt} sqft
                </span>
              )}
            </div>
          )}

          {listing.jobDetails && (
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {listing.jobDetails.companyName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] uppercase">
                {listing.jobDetails.jobType.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Card Footer: Location & User Avatar & Contact Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[60%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleContact}
              title="Message Owner"
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenDetails(listing)}
              className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-blue-600 rounded-lg transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
