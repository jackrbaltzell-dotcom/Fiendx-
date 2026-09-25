import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Building,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VerificationRequest, Report, Listing } from '../types';
import { dbService } from '../services/dbService';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'listings'>('verifications');

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [vList, rList, lList] = await Promise.all([
        dbService.getVerificationRequests(),
        dbService.getReports(),
        dbService.getListings(),
      ]);
      setVerifications(vList);
      setReports(rList);
      setListings(lList);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1">
          This area is restricted to FindX platform administrators.
        </p>
      </div>
    );
  }

  const handleUpdateVerification = async (
    reqId: string,
    status: 'approved' | 'rejected',
    targetUserId: string,
    type: VerificationRequest['type']
  ) => {
    await dbService.updateVerificationStatus(reqId, status, targetUserId, type);
    setVerifications((prev) =>
      prev.map((v) => (v.id === reqId ? { ...v, status } : v))
    );
  };

  const handleUpdateReport = async (reportId: string, status: Report['status']) => {
    await dbService.updateReportStatus(reportId, status);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing as administrator?')) return;
    await dbService.deleteListing(listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-600">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin & Moderation Hub</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Platform-wide moderation, identity verification approvals, and listings management.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Total Listings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{listings.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Pending Verifications</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {verifications.filter((v) => v.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Active Reports</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {reports.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400">Platform Status</span>
          <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Healthy & Operational
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'verifications', label: `Verifications (${verifications.length})` },
          { id: 'reports', label: `Moderation Reports (${reports.length})` },
          { id: 'listings', label: `All Listings (${listings.length})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                active
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Verifications Queue */}
      {activeTab === 'verifications' && (
        <div className="space-y-3">
          {verifications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
              No verification requests submitted.
            </div>
          ) : (
            verifications.map((v) => (
              <div
                key={v.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{v.userName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({v.userEmail})</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold uppercase text-[10px]">
                      {v.type}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">Notes: {v.notes}</p>
                  <span className="text-[10px] text-slate-400">
                    Status: <b className="uppercase">{v.status}</b>
                  </span>
                </div>

                {v.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateVerification(v.id, 'approved', v.userId, v.type)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateVerification(v.id, 'rejected', v.userId, v.type)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Moderation Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
              No reports in moderation queue.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-700 uppercase tracking-wide text-[10px] bg-rose-50 px-2 py-0.5 rounded-md">
                      {r.reason}
                    </span>
                    <span className="text-slate-500 font-semibold">Target Type: {r.targetType}</span>
                  </div>
                  <p className="text-slate-800 font-medium mt-1">Details: "{r.details}"</p>
                  <span className="text-[10px] text-slate-400">
                    Status: <b className="uppercase">{r.status}</b> • Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateReport(r.id, 'resolved')}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                    >
                      Mark Resolved
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateReport(r.id, 'dismissed')}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Listings Overview */}
      {activeTab === 'listings' && (
        <div className="space-y-2">
          {listings.map((l) => (
            <div
              key={l.id}
              className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-4">
                <span className="font-bold text-slate-900 truncate block">{l.title}</span>
                <span className="text-slate-500 text-[11px]">
                  {l.category} • {l.location} • By {l.userFullName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteListing(l.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                title="Admin Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
