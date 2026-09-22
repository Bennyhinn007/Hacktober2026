'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';

export default function PaymentsVerificationQueue() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations?paymentStatus=${statusFilter}&limit=50`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleAction = async (regId: string, status: 'VERIFIED' | 'REJECTED') => {
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/payments/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`Payment ${status} successfully.`);
        setSelectedPayment(null);
        setAdminNote('');
        fetchPayments();
      } else {
        setMsg(json.error || 'Update failed');
      }
    } catch (err: any) {
      setMsg(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const openInspection = async (regId: string) => {
    try {
      const res = await fetch(`/api/admin/registrations/${regId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedPayment(json.data);
      }
    } catch (err) {
      console.error('Error opening payment inspection:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payment Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit candidate transaction receipts and confirm bank UTR entries.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-2xs">
          {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Grid: Queue on Left, Side-by-side Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            </div>
          ) : items.length > 0 ? (
            items.map((item) => {
              const isSelected =
                selectedPayment?.registration?.registrationId === item.registration.registrationId;
              return (
                <div
                  key={item.registration.registrationId}
                  onClick={() => openInspection(item.registration.registrationId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-teal-700">
                        {item.registration.registrationId}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.primaryParticipant?.fullName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      USN: <span className="font-mono font-semibold">{item.primaryParticipant?.usn}</span>
                      {' • '}
                      Amount: <strong className="text-slate-900">₹{item.amount}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.paymentStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.paymentStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No payments matching &quot;{statusFilter}&quot; status in queue.
            </div>
          )}
        </div>

        {/* Right Inspection Panel */}
        <div className="lg:col-span-5">
          {selectedPayment ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Payment Audit Inspector</h3>
                <span className="font-mono text-xs font-bold text-teal-700">
                  {selectedPayment.registration.registrationId}
                </span>
              </div>

              {/* Transaction details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Candidate:</span>
                  <strong className="text-slate-900">
                    {selectedPayment.participants.find((p: any) => p.isPrimary)?.fullName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID (UTR):</span>
                  <strong className="font-mono text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {selectedPayment.payment?.transactionId || 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registration Amount:</span>
                  <strong className="text-base font-black text-slate-900 font-mono">
                    ₹{selectedPayment.payment?.amount || selectedPayment.registration.totalAmount}
                  </strong>
                </div>
              </div>

              {/* Receipt Screenshot Box */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Uploaded Bank Screenshot
                </span>
                {selectedPayment.payment?.screenshotUrl ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden">
                    <img
                      src={selectedPayment.payment.screenshotUrl}
                      alt="Bank Receipt"
                      className="w-full max-h-64 object-contain rounded-lg mx-auto bg-white"
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                    No screenshot uploaded
                  </div>
                )}
              </div>

              {/* Optional Admin Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Internal Organizer Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified on bank statement #14"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Verification Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    handleAction(selectedPayment.registration.registrationId, 'VERIFIED')
                  }
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Payment</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    handleAction(selectedPayment.registration.registrationId, 'REJECTED')
                  }
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Payment</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Select any payment record from the queue to inspect screenshot and verify UTR.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
