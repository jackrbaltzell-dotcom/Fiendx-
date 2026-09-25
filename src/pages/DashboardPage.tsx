import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building,
  Calendar,
  Briefcase,
  Heart,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Listing, Booking, JobApplication, VerificationRequest } from '../types';
import { dbService } from '../services/dbService';
import { ListingCard } from '../components/ListingCard';

interface DashboardPageProps {
  onOpenDetails: (listing: Listing) => void;
  onOpenAdd: () => void;
  onOpenAuth: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenDetails,
  onOpenAdd,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'applications' | 'saved' | 'verify'>('listings');

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [savedListings, setSavedListings] = useState<Listing[]>([]);

  // Verification request form state
  const [verifyType, setVerifyType] = useState<VerificationRequest['type']>('identity');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySubmitted, setVerifySubmitted] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allListings, bookings, apps, saved] = await Promise.all([
        dbService.getListings(),
        dbService.getUserBookings(user.uid),
        dbService.getMyApplications(user.uid),
        dbService.getUserSavedListings(user.uid),
      ]);

      setMyListings(allListings.filter((l) => l.userId === user.uid));
      setMyBookings(bookings);
      setMyApplications(apps);
      setSavedListings(saved);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">You must be logged in to view your dashboard.</p>
        <button
          onClick={onOpenAuth}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return;
    await dbService.deleteListing(id);
    setMyListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: Booking['status'], customerId: string) => {
    await dbService.updateBookingStatus(bookingId, status, customerId);
    setMyBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await dbService.submitVerificationRequest({
        userId: user.uid,
        userName: profile.fullName,
        userEmail: profile.email,
        type: verifyType,
        notes: verifyNotes,
      });
      setVerifySubmitted(true);
      setVerifyNotes('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            User Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            My Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your listings, booking appointments, job applications, and verification requests.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Discovery</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'listings', label: `My Listings (${myListings.length})`, icon: Building },
          { id: 'bookings', label: `Bookings (${myBookings.length})`, icon: Calendar },
          { id: 'applications', label: `Applications (${myApplications.length})`, icon: Briefcase },
          { id: 'saved', label: `Saved Items (${savedListings.length})`, icon: Heart },
          { id: 'verify', label: 'Verification Badge', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. MY LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-xs text-slate-500">
              You haven't posted any listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myListings.map((listing) => (
                <div key={listing.id} className="relative group">
                  <ListingCard
                    listing={listing}
                    onOpenDetails={onOpenDetails}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteListing(listing.id);
                    }}
                    title="Delete Listing"
                    className="absolute top-3 left-3 z-20 p-2 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              No service or visit bookings yet.
            </div>
          ) : (
            myBookings.map((b) => {
              const isProvider = b.providerId === user.uid;
              return (
                <div
                  key={b.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{b.serviceTitle}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Date: <b>{b.bookingDate}</b> at <b>{b.bookingTime}</b> • Customer: <b>{b.customerName}</b> ({b.customerPhone})
                    </p>
                    {b.notes && (
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg">
                        Note: {b.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions for provider */}
                  {isProvider && b.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(b.id, 'confirmed', b.customerId)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                      >
                        Confirm Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBookingStatus(b.id, 'cancelled', b.customerId)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. JOB APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-3">
          {myApplications.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              You haven't submitted any job applications yet.
            </div>
          ) : (
            myApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{app.jobTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                    "{app.coverLetter}"
                  </p>
                </div>
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                  {app.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. SAVED ITEMS TAB */}
      {activeTab === 'saved' && (
        <div>
          {savedListings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl text-xs text-slate-400">
              No saved items yet. Tap the heart icon on any listing to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. VERIFICATION TAB */}
      {activeTab === 'verify' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-base font-bold">Request Official Verification Badge</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gain trust across the FindX discovery network. Verified profiles and businesses receive priority placement and an authentic verified badge.
          </p>

          {verifySubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-xs font-bold text-emerald-900">Application Submitted</h4>
              <p className="text-[11px] text-emerald-700">
                Our administrative board will review your credentials shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitVerification} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Badge Type</label>
                <select
                  value={verifyType}
                  onChange={(e: any) => setVerifyType(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
                >
                  <option value="identity">Identity Verification (NID / Passport)</option>
                  <option value="business">Business License / Trade License</option>
                  <option value="professional">Professional License (BMDC, Bar Council, etc.)</option>
                  <option value="phone">Phone Verification</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Verification Notes / Document Links
                </label>
                <textarea
                  rows={3}
                  required
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Provide registration number, license code, or document verification details..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {verifying ? 'Submitting Application...' : 'Submit Verification Request'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
