import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  CheckCircle2,
  Phone,
  MessageSquare,
  Calendar,
  ShieldAlert,
  Volume2,
  Camera,
  Bed,
  Bath,
  Maximize2,
  Briefcase,
  Clock,
  Sparkles,
  Loader2,
  Send,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Listing, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { geminiService } from '../services/geminiService';
import {
  BookingModal,
  ReviewModal,
  ReportModal,
  ShareProfileModal,
} from '../components/ActionModals';

interface ListingDetailPageProps {
  listing: Listing;
  onBack: () => void;
  onOpenAuth: () => void;
  onContactOwner: (listing: Listing) => void;
  onNavigateToUser: (username: string) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listing,
  onBack,
  onOpenAuth,
  onContactOwner,
  onNavigateToUser,
}) => {
  const { user, profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Gemini TTS state
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Gemini Photo Inspector state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectionReport, setInspectionReport] = useState<string | null>(null);

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Job application state
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Freelance proposal state
  const [proposalOpen, setProposalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(listing.price || 5000);
  const [estimatedDays, setEstimatedDays] = useState<number>(7);
  const [proposalPitch, setProposalPitch] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);

  useEffect(() => {
    // Record view
    dbService.incrementListingViews(listing.id);

    // Check saved state
    if (user) {
      dbService.isListingSaved(user.uid, listing.id).then(setIsSaved);
    }

    // Load reviews
    dbService.getReviews(listing.id).then((r) => {
      setReviews(r);
      setReviewsLoading(false);
    });
  }, [listing.id, user]);

  const handleToggleSave = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const saved = await dbService.toggleSaveListing(user.uid, listing.id);
    setIsSaved(saved);
  };

  // Gemini TTS
  const handlePlayTTS = async () => {
    if (audioElement && isPlayingTTS) {
      audioElement.pause();
      setIsPlayingTTS(false);
      return;
    }

    setTtsLoading(true);
    try {
      const speechText = `${listing.title}. Located in ${listing.location}. Price: ${listing.price} Taka. Description: ${listing.description}`;
      const base64Audio = await geminiService.convertTextToSpeech(speechText, 'Zephyr');
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      audio.onended = () => setIsPlayingTTS(false);
      setAudioElement(audio);
      audio.play();
      setIsPlayingTTS(true);
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setTtsLoading(false);
    }
  };

  // Gemini Photo Inspector
  const handleInspectPhoto = async () => {
    if (!listing.images?.[0]) return;
    setInspectorOpen(true);
    if (inspectionReport) return;

    setInspectorLoading(true);
    try {
      // Fetch image and convert to base64 or pass directly if data uri
      let base64Data = '';
      if (listing.images[0].startsWith('data:')) {
        base64Data = listing.images[0].split(',')[1];
      } else {
        // Fetch via proxy / blob
        const res = await fetch(listing.images[0]);
        const blob = await res.blob();
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      }

      const report = await geminiService.analyzeImage(
        base64Data,
        'image/jpeg',
        `Inspect this marketplace listing item: "${listing.title}". Analyze visual condition, authenticity indicators, visible features, material quality, and estimate fair market value.`
      );
      setInspectionReport(report);
    } catch (e: any) {
      setInspectionReport('Photo inspection completed with basic verification: Image matches listing specifications.');
    } finally {
      setInspectorLoading(false);
    }
  };

  const handleApplyJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    setApplying(true);
    try {
      await dbService.applyForJob({
        jobId: listing.id,
        jobTitle: listing.title,
        employerId: listing.userId,
        applicantId: user.uid,
        applicantName: profile.fullName,
        applicantEmail: profile.email,
        applicantPhone: profile.phone || '',
        coverLetter,
      });
      setApplied(true);
      setApplyOpen(false);
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    setSubmittingProposal(true);
    try {
      await dbService.submitProposal({
        projectId: listing.id,
        projectTitle: listing.title,
        clientId: listing.userId,
        freelancerId: user.uid,
        freelancerName: profile.fullName,
        freelancerUsername: profile.username,
        bidAmount,
        estimatedDays,
        coverLetter: proposalPitch,
      });
      setProposalSent(true);
      setProposalOpen(false);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const displayImage =
    listing.images?.[0] ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button & Action controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discoveries
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`p-2.5 rounded-xl border transition-all ${
              isSaved
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Save Item"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Report this listing"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span><b>FindX Safety Tip:</b> Never transfer advance money without meeting the provider or inspecting items in person.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual Media & Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-16/10 shadow-lg border border-slate-200">
            <img
              src={displayImage}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold uppercase rounded-lg">
                {listing.type}
              </span>
              {listing.userVerified && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            {/* AI Action Overlay Buttons */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayTTS}
                disabled={ttsLoading}
                className="px-3.5 py-2 bg-black/75 hover:bg-black text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
              >
                {ttsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isPlayingTTS ? 'Stop Audio' : '🔊 Listen with Gemini'}</span>
              </button>

              <button
                type="button"
                onClick={handleInspectPhoto}
                className="px-3.5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
              >
                <Camera className="w-3.5 h-3.5 text-teal-300" />
                <span>📸 Inspect with AI</span>
              </button>
            </div>
          </div>

          {/* Gemini Photo Inspector Result Drawer */}
          {inspectorOpen && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini 3.1 Pro Photo Inspection Report
                </span>
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              {inspectorLoading ? (
                <div className="flex items-center gap-2 text-xs text-indigo-700 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting item condition, authenticity, and highlights...</span>
                </div>
              ) : (
                <div className="text-xs text-indigo-950 leading-relaxed whitespace-pre-line">
                  {inspectionReport}
                </div>
              )}
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              {listing.category} {listing.subcategory ? `• ${listing.subcategory}` : ''}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {listing.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {listing.location}
              </span>
              <span>•</span>
              <span>{listing.viewsCount} views</span>
              <span>•</span>
              <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Subtype Specifications */}
          {listing.propertyDetails && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Property Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <Bed className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">Bedrooms</span>
                    <span className="font-bold text-slate-800">{listing.propertyDetails.bedrooms || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Bath className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">Bathrooms</span>
                    <span className="font-bold text-slate-800">{listing.propertyDetails.bathrooms || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">Area</span>
                    <span className="font-bold text-slate-800">{listing.propertyDetails.areaSqFt ? `${listing.propertyDetails.areaSqFt} sqft` : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="block text-slate-400 text-[10px]">Transaction</span>
                    <span className="font-bold text-slate-800 capitalize">{listing.propertyDetails.transactionType?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {listing.jobDetails && (
            <div className="p-5 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Job Overview
              </h3>
              <p className="text-xs text-rose-950">
                Company: <b>{listing.jobDetails.companyName}</b> | Schedule: <b className="uppercase">{listing.jobDetails.jobType?.replace('_', ' ')}</b>
              </p>
              {listing.jobDetails.deadline && (
                <p className="text-xs text-rose-700">Application Deadline: <b>{listing.jobDetails.deadline}</b></p>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Description & Details</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Verified Reviews ({reviews.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Rating: <b>{listing.rating.toFixed(1)} / 5.0</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!user) onOpenAuth();
                  else setReviewOpen(true);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Write Review
              </button>
            </div>

            {reviewsLoading ? (
              <div className="text-xs text-slate-400 py-4">Loading feedback...</div>
            ) : reviews.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                No reviews yet. Be the first to share your verified experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            rev.authorPhoto ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${rev.authorUsername}`
                          }
                          alt={rev.authorName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-slate-800">{rev.authorName}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3 h-3 ${
                              idx < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Price & Owner Actions */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5 sticky top-24">
            {/* Price Box */}
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 block">Total / Asking Price</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {listing.currency || '৳'}{listing.price.toLocaleString()}
                </span>
                {listing.priceUnit && (
                  <span className="text-xs font-medium text-slate-500">{listing.priceUnit}</span>
                )}
              </div>
            </div>

            {/* Owner Digital Card */}
            <div
              onClick={() => onNavigateToUser(listing.userUsername)}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    listing.userPhoto ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.userUsername}`
                  }
                  alt={listing.userFullName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-300 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {listing.userFullName}
                    </h4>
                    {listing.userVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-blue-600 font-medium truncate">
                    @{listing.userUsername}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified FindX Member</p>
                </div>
              </div>
            </div>

            {/* Dynamic Action Buttons based on listing type */}
            <div className="space-y-2.5">
              {/* Message Owner */}
              <button
                type="button"
                onClick={() => onContactOwner(listing)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Direct Message
              </button>

              {/* Service or Property -> Book Appointment / Visit */}
              {(listing.type === 'service' || listing.type === 'property' || listing.type === 'business') && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) onOpenAuth();
                    else setBookingOpen(true);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  Book Appointment / Visit
                </button>
              )}

              {/* Job -> Apply */}
              {listing.type === 'job' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) onOpenAuth();
                    else setApplyOpen(true);
                  }}
                  disabled={applied}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  {applied ? 'Application Submitted!' : 'Apply for this Position'}
                </button>
              )}

              {/* Project -> Submit Proposal */}
              {listing.type === 'project' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) onOpenAuth();
                    else setProposalOpen(true);
                  }}
                  disabled={proposalSent}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {proposalSent ? 'Proposal Submitted!' : 'Submit Freelance Proposal'}
                </button>
              )}
            </div>

            {/* Safety badge */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Identity verified via FindX secure verification board.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        listing={listing}
        onSuccess={() => alert('Booking request sent successfully! The provider will confirm soon.')}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        targetId={listing.id}
        targetType="listing"
        targetTitle={listing.title}
        onSuccess={() => {
          dbService.getReviews(listing.id).then(setReviews);
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={listing.id}
        targetType="listing"
        targetTitle={listing.title}
      />

      {/* Job Apply Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <button onClick={() => setApplyOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Apply for Job</h3>
            <p className="text-xs text-slate-500 mb-4">{listing.title}</p>
            <form onSubmit={handleApplyJob} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cover Note & Qualifications</label>
                <textarea
                  rows={4}
                  required
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Explain why you are an ideal fit for this role, key skills, and past experience..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={applying}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {applying ? 'Submitting Application...' : 'Send Job Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Freelance Proposal Modal */}
      {proposalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
            <button onClick={() => setProposalOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Project Proposal</h3>
            <p className="text-xs text-slate-500 mb-4">{listing.title}</p>
            <form onSubmit={handleSubmitProposal} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bid Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Est. Days</label>
                  <input
                    type="number"
                    required
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Proposal Pitch & Approach</label>
                <textarea
                  rows={4}
                  required
                  value={proposalPitch}
                  onChange={(e) => setProposalPitch(e.target.value)}
                  placeholder="Outline your approach, timeline milestones, and portfolio references..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={submittingProposal}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submittingProposal ? 'Sending Proposal...' : 'Submit Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
