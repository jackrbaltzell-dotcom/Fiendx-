import React, { useState, useEffect } from 'react';
import { HelpCircle, MapPin, Send, MessageSquare, Plus, DollarSign, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RequestItem, RequestResponse } from '../types';
import { dbService } from '../services/dbService';

interface RequestsPageProps {
  onOpenAuth: () => void;
  onOpenAdd: () => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ onOpenAuth, onOpenAdd }) => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [responses, setResponses] = useState<RequestResponse[]>([]);

  // Response form
  const [replyMessage, setReplyMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await dbService.getRequests();
      setRequests(data);
    } catch (e) {
      console.error('Error fetching requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSelectRequest = async (req: RequestItem) => {
    setSelectedRequestId(req.id);
    const resps = await dbService.getRequestResponses(req.id);
    setResponses(resps);
  };

  const handleSendQuote = async (e: React.FormEvent, req: RequestItem) => {
    e.preventDefault();
    if (!user || !profile) {
      onOpenAuth();
      return;
    }
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      await dbService.respondToRequest(
        {
          requestId: req.id,
          providerId: user.uid,
          providerName: profile.fullName,
          providerUsername: profile.username,
          providerPhoto: profile.photoURL,
          providerPhone: profile.phone,
          message: replyMessage.trim(),
          offerPrice: offerPrice === '' ? undefined : Number(offerPrice),
        },
        req.userId,
        req.title
      );
      setReplyMessage('');
      setOfferPrice('');
      const updated = await dbService.getRequestResponses(req.id);
      setResponses(updated);
      fetchRequests();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Two-Sided Request Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            "I Need" Requests Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Post what service, property, or gadget you need — local providers and sellers quote directly.
          </p>
        </div>

        <button
          type="button"
          onClick={user ? onOpenAdd : onOpenAuth}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post What You Need</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-xs text-slate-400 py-8">Loading active requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-slate-400 text-xs">
              No open requests found. Be the first to post what you need!
            </div>
          ) : (
            requests.map((req) => {
              const isSelected = selectedRequestId === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-blue-600 uppercase text-[10px] px-2 py-0.5 rounded-md bg-blue-50">
                      {req.category}
                    </span>
                    {req.budget && (
                      <span className="font-black text-slate-900">
                        Budget: ৳{req.budget.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          req.userPhoto ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userUsername}`
                        }
                        alt={req.userFullName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{req.userFullName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {req.location}
                      </span>
                      <span className="font-bold text-teal-600">
                        {req.responsesCount} responses
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Request Responses Drawer */}
        <div className="space-y-4">
          {selectedRequestId ? (
            (() => {
              const activeReq = requests.find((r) => r.id === selectedRequestId);
              if (!activeReq) return null;
              return (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4 sticky top-24">
                  <h4 className="font-bold text-sm text-slate-900">
                    Respond / Quote for this Request
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    Target: <b>{activeReq.title}</b>
                  </p>

                  {/* Send response quote form */}
                  <form onSubmit={(e) => handleSendQuote(e, activeReq)} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Your Offer Price (৳)
                      </label>
                      <input
                        type="number"
                        value={offerPrice}
                        onChange={(e) =>
                          setOfferPrice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="e.g. 1500"
                        className="w-full p-2 text-xs border border-slate-300 rounded-xl outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Message / Proposal Quote
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Explain your availability, expertise, or product offer..."
                        className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending || !replyMessage.trim()}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sending ? 'Sending Quote...' : 'Send Quote / Response'}</span>
                    </button>
                  </form>

                  {/* Existing Quotes */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h5 className="font-bold text-xs text-slate-700">
                      Responses ({responses.length})
                    </h5>
                    {responses.length === 0 ? (
                      <p className="text-xs text-slate-400">No quotes received yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {responses.map((resp) => (
                          <div
                            key={resp.id}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{resp.providerName}</span>
                              {resp.offerPrice && (
                                <span className="font-bold text-emerald-600">৳{resp.offerPrice}</span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{resp.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              Click on any request on the left to view details and submit a quote.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
