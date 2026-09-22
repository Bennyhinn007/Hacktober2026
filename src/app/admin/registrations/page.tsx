'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Loader2,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export default function RegistrationsManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [eventId, setEventId] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [attendanceStatus, setAttendanceStatus] = useState('ALL');
  const [department, setDepartment] = useState('ALL');

  // Detail Drawer State
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        search: search.trim(),
        eventId,
        paymentStatus,
        attendanceStatus,
        department,
      });

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error('Error listing registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, eventId, paymentStatus, attendanceStatus, department]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleOpenDetail = async (regId: string) => {
    setSelectedRegId(regId);
    setDetailLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/registrations/${regId}`);
      const json = await res.json();
      if (json.success) {
        setDetailData(json.data);
      }
    } catch (err) {
      console.error('Error fetching registration detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdatePayment = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRegId) return;
    try {
      const res = await fetch(`/api/admin/payments/${selectedRegId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(`Payment updated to ${status}`);
        handleOpenDetail(selectedRegId);
        fetchRegistrations();
      } else {
        setActionMessage(json.error || 'Failed to update payment');
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Payment update error');
    }
  };

  const handleToggleArchive = async (archive: boolean) => {
    if (!selectedRegId) return;
    try {
      const res = await fetch(`/api/admin/registrations/${selectedRegId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: archive ? 'ARCHIVE' : 'RESTORE' }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage(archive ? 'Registration soft-deleted (archived)' : 'Registration restored');
        handleOpenDetail(selectedRegId);
        fetchRegistrations();
      }
    } catch (err: any) {
      setActionMessage(err.message || 'Archive error');
    }
  };

  const exportUrl = (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams({
      format,
      search: search.trim(),
      eventId,
      paymentStatus,
      attendanceStatus,
      department,
    });
    return `/api/admin/exports?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Registration Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total records found: <strong className="text-slate-900">{total}</strong>
          </p>
        </div>

        {/* Filter-aware exports */}
        <div className="flex items-center gap-2">
          <a
            href={exportUrl('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title="Exports active filter records"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Filtered CSV</span>
          </a>
          <a
            href={exportUrl('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title="Exports active filter records"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Filtered Excel</span>
          </a>
        </div>
      </div>

      {/* Search & Multi-filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by ID, Name, Email, USN, Team..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Events (5)</option>
              {OFFICIAL_EVENTS.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Payments</option>
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div>
            <select
              value={attendanceStatus}
              onChange={(e) => {
                setAttendanceStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Attendance</option>
              <option value="NOT_MARKED">NOT_MARKED</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <span className="text-xs text-slate-400">Loading registrations...</span>
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">USN / Student ID</th>
                  <th className="py-3 px-4">Events</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.registration.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {item.registration.registrationId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.primaryParticipant?.fullName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.primaryParticipant?.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {item.primaryParticipant?.usn || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.registration.eventIds.length} event(s)
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {item.teamName || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{item.amount}
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {item.registration.attendanceStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(item.registration.registrationId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-semibold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            No registrations match your search and filter criteria.
          </div>
        )}

        {/* Server Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-900">{page}</strong> of{' '}
            <strong className="text-slate-900">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Registration Detail Drawer / Modal */}
      {selectedRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registration Detail Inspection
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  ID: <span className="font-mono text-teal-700">{selectedRegId}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedRegId(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionMessage && (
              <div className="p-3 rounded-xl bg-slate-100 text-slate-900 font-semibold text-xs flex items-center gap-2">
                <span>{actionMessage}</span>
              </div>
            )}

            {detailLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
              </div>
            ) : detailData ? (
              <div className="space-y-6 text-xs">
                {/* Candidate Information */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Primary Participant Details</h4>
                  {detailData.participants.map((p: any) => {
                    if (!p.isPrimary) return null;
                    return (
                      <div key={p.id} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-400 block">Name:</span>
                          <strong className="text-slate-900">{p.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Email:</span>
                          <span className="font-mono">{p.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Phone:</span>
                          <span>{p.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">USN:</span>
                          <span className="font-mono font-bold text-slate-900">{p.usn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">College:</span>
                          <span>{p.college}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Department:</span>
                          <span>
                            {p.department} ({p.yearSemester})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Team Info if Applicable */}
                {detailData.team && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Team Roster</h4>
                      <span className="font-semibold text-slate-700 font-mono">
                        Team Name: {detailData.team.teamName}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {detailData.participants.map((m: any, idx: number) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{m.fullName}</span>
                            <span className="text-slate-500 text-[11px] ml-2 font-mono">
                              ({m.usn}) • {m.email}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {m.isPrimary ? 'Leader' : `Member ${idx}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Screenshot & Details */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">Payment Proof & UTR</h4>
                    <span className="font-mono font-bold text-slate-800">
                      Amount: ₹{detailData.payment?.amount || detailData.registration.totalAmount}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <span className="text-slate-500 block">Transaction ID / UTR:</span>
                      <strong className="font-mono text-sm text-slate-900">
                        {detailData.payment?.transactionId || 'N/A'}
                      </strong>
                      <div className="mt-2">
                        <span className="text-slate-500 block">Status:</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-xs bg-amber-100 text-amber-900">
                          {detailData.payment?.status || detailData.registration.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Screenshot preview */}
                    {detailData.payment?.screenshotUrl ? (
                      <div>
                        <span className="text-slate-400 block text-[11px] mb-1">
                          Bank Receipt Screenshot:
                        </span>
                        <img
                          src={detailData.payment.screenshotUrl}
                          alt="Payment Screenshot"
                          className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white p-1"
                        />
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic">No screenshot attached.</div>
                    )}
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdatePayment('VERIFIED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Payment</span>
                    </button>
                    <button
                      onClick={() => handleUpdatePayment('REJECTED')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Payment</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {detailData.registration.isArchived ? (
                      <button
                        onClick={() => handleToggleArchive(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Restore Record</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleArchive(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Soft Delete (Archive)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
