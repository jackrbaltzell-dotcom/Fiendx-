import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Layers, MapPin, Navigation, Eye, MessageCircle, ExternalLink } from 'lucide-react';
import { Listing } from '../types';

interface InteractiveMapProps {
  listings: Listing[];
  onSelectListing?: (listing: Listing) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectableLocation?: boolean;
  onLocationSelected?: (coords: { lat: number; lng: number }) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  property: '#2563eb', // Blue
  product: '#059669', // Emerald
  service: '#d97706', // Amber
  business: '#7c3aed', // Purple
  job: '#e11d48', // Rose
  project: '#0891b2', // Cyan
  default: '#475569', // Slate
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  listings,
  onSelectListing,
  center = [23.8103, 90.4125], // Default Dhaka center
  zoom = 12,
  height = '500px',
  selectableLocation = false,
  onLocationSelected,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      if (selectableLocation) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (onLocationSelected) {
            onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when listings or category filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = selectedCategory === 'all'
      ? listings
      : listings.filter((l) => l.type === selectedCategory);

    filtered.forEach((item) => {
      // Use coordinates or approximate based on item id if missing
      const lat = item.coordinates?.lat || (23.75 + (Math.sin(item.title.length * 9) * 0.08));
      const lng = item.coordinates?.lng || (90.38 + (Math.cos(item.title.length * 7) * 0.08));

      const color = CATEGORY_COLORS[item.type] || CATEGORY_COLORS.default;

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <div style="transform: rotate(45deg); font-size: 11px; font-weight: bold;">
              ${item.type === 'property' ? '🏠' : item.type === 'product' ? '🛍️' : item.type === 'service' ? '🔧' : item.type === 'business' ? '🏬' : '💼'}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setActiveListing(item);
        if (onSelectListing) {
          onSelectListing(item);
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [listings, selectedCategory]);

  // "Near Me" GPS Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setIsLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 14, { duration: 1.5 });

          // Add User Location Pulse Pin
          const userIcon = L.divIcon({
            className: 'user-pulse-marker',
            html: `
              <div style="position: relative;">
                <div style="width: 16px; height: 16px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px #3b82f6;"></div>
                <div style="position: absolute; top: -8px; left: -8px; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker(coords, { icon: userIcon }).addTo(mapInstanceRef.current);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or unavailable:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200" style={{ height }}>
      {/* Category Filter Chips atop the map */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap gap-1.5 max-w-[85%] bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-slate-200">
        {[
          { id: 'all', label: 'All Markers' },
          { id: 'property', label: 'Property' },
          { id: 'business', label: 'Businesses' },
          { id: 'service', label: 'Services' },
          { id: 'product', label: 'Products' },
          { id: 'job', label: 'Jobs' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Near Me GPS Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        title="Find Near Me (GPS)"
        className="absolute top-3 right-3 z-[400] bg-white text-slate-800 hover:text-blue-600 p-2.5 rounded-xl shadow-md border border-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95"
      >
        <Navigation className={`w-4 h-4 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Near Me</span>
      </button>

      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Marker Preview Card Drawer at Bottom */}
      {activeListing && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[400] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 animate-in slide-in-from-bottom duration-200">
          <div className="flex gap-3">
            <img
              src={
                activeListing.images?.[0] ||
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'
              }
              alt={activeListing.title}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  {activeListing.type}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveListing(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-1">{activeListing.title}</h4>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {activeListing.location}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-black text-blue-600">
                  {activeListing.currency || '৳'}{activeListing.price.toLocaleString()}
                  {activeListing.priceUnit && <span className="text-[10px] font-normal text-slate-500">{activeListing.priceUnit}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectListing && onSelectListing(activeListing)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
