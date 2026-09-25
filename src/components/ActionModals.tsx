import React, { useState } from 'react';
import {
  X,
  Star,
  Calendar,
  Clock,
  Phone,
  Mail,
  ShieldAlert,
  Share2,
  Copy,
  Check,
  QrCode,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { Listing, UserProfile } from '../types';

// ===================== BOOKING MODAL =====================
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, listing, onSuccess }) => {
  const { user, profile } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError('Please sign in to book this appointment.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await dbService.createBooking({
        serviceId: listing.id,
        serviceTitle: listing.title,
        providerId: listing.userId,
        providerName: listing.userFullName,
        customerId: user.uid,
        customerName: profile.fullName,
        customerPhone: phone,
        customerEmail: email,
        bookingDate: date,
        bookingTime: time,
        notes,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Book Appointment / Visit</h3>
        <p className="text-xs text-slate-500 mb-4 truncate">
          For: <b>{listing.title}</b> with {listing.userFullName}
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Preferred Time</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1..."
              className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Special Instructions / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Address details, specific symptoms, or room visit request..."
              className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {submitting ? 'Confirming...' : 'Submit Booking Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ===================== REVIEW MODAL =====================
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'listing' | 'user' | 'business';
  targetTitle: string;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
  onSuccess,
}) => {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError('Please sign in to write a review.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write your review feedback.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await dbService.addReview({
        targetId,
        targetType,
        authorId: user.uid,
        authorName: profile.fullName,
        authorUsername: profile.username,
        authorPhoto: profile.photoURL,
        rating,
        comment,
        verifiedPurchase: true,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-1">Write a Review</h3>
        <p className="text-xs text-slate-500 mb-4 truncate">
          Reviewing: <b>{targetTitle}</b>
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2 text-center">
              Rating Score
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Your Feedback & Experience
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the provider punctual, honest, and high quality?"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Post Verified Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ===================== REPORT MODAL =====================
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'listing' | 'user' | 'post' | 'comment';
  targetTitle: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<any>('fake_listing');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await dbService.submitReport({
        reporterId: user.uid,
        targetId,
        targetType,
        reason,
        details,
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-rose-600">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">Safety & Moderation Report</h3>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-900">Report Received</h4>
            <p className="text-xs text-slate-500 mt-1">
              Thank you for keeping FindX safe. Our moderation team reviews reports within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-500">
              Reporting: <b>{targetTitle}</b>
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden bg-white"
              >
                <option value="fake_listing">Fake Listing or Fraud</option>
                <option value="scam">Advance Payment Scam</option>
                <option value="wrong_price">Misleading Price or Location</option>
                <option value="already_sold">Already Sold or Unavailable</option>
                <option value="harassment">Harassment or Offensive Content</option>
                <option value="spam">Spam / Duplicate Posting</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Explanation</label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe why this listing or user violates community safety rules..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report to Moderation'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ===================== DIGITAL BUSINESS CARD SHARE MODAL =====================
interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, profile }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const profileUrl = `${window.location.origin}/@${profile.username}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-center animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>

        {/* Digital Card Preview */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-5 text-white shadow-xl mb-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[10px] font-black tracking-widest text-blue-400">
            FINDX CARD
          </div>
          <img
            src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
            alt={profile.fullName}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/80 mx-auto shadow-md mb-2"
          />
          <h4 className="font-bold text-base">{profile.fullName}</h4>
          <p className="text-xs text-blue-300 font-medium">@{profile.username}</p>
          {profile.profession && (
            <p className="text-xs text-slate-200 mt-1 font-semibold">{profile.profession}</p>
          )}
          {profile.location && (
            <p className="text-[11px] text-slate-300 mt-0.5">{profile.location}</p>
          )}

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-300 font-mono">
            {profileUrl}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={profileUrl}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-700 outline-hidden font-mono"
          />
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
