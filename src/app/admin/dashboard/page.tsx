'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  QrCode,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Download,
  ArrowRight,
  TrendingUp,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/dashboard');
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading live analytics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Registrations',
      value: stats?.totalRegistrations ?? 0,
      icon: Users,
      color: 'text-slate-900',
      bg: 'bg-slate-100',
    },
    {
      label: 'Verified Payments',
      value: stats?.paidRegistrations ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending Verifications',
      value: stats?.pendingPayments ?? 0,
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      label: 'Rejected Payments',
      value: stats?.rejectedPayments ?? 0,
      icon: XCircle,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
    },
    {
      label: 'Total Participants',
      value: stats?.totalParticipants ?? 0,
      icon: Users,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: 'Registered Teams',
      value: stats?.totalTeams ?? 0,
      icon: Users,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Total Revenue',
      value: `₹${stats?.totalRevenue ?? 0}`,
      icon: DollarSign,
      color: 'text-teal-700',
      bg: 'bg-teal-50',
    },
    {
      label: 'Check-in Attendance',
      value: stats?.totalAttendance ?? 0,
      icon: QrCode,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Event Operations Command
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics and participant control for Hacktober 2026.
          </p>
        </div>

        {/* Quick Export / Scanner Actions */}
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/exports?format=csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/admin/exports?format=xlsx"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </a>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-teal-700 shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Scanner</span>
          </Link>
        </div>
      </div>

      {/* 8 Stats Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono ${card.color}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Participation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5 Events Distribution */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Event Participation Breakdown</h3>
            <span className="text-xs text-slate-500 font-medium">5 Signature Contests</span>
          </div>

          <div className="space-y-4">
            {OFFICIAL_EVENTS.map((event) => {
              const count = stats?.eventParticipation?.[event.id] ?? 0;
              const total = stats?.totalRegistrations || 1;
              const percentage = Math.min(100, Math.round((count / total) * 100));

              return (
                <div key={event.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{event.name}</span>
                    <span className="font-mono text-slate-600 font-semibold">
                      {count} registrations ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Payment Status Summary */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <h3 className="text-base font-bold text-slate-900">Payment Pipeline Health</h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <strong className="text-emerald-950 block">Verified & Cleared</strong>
                <span className="text-emerald-700 text-[11px]">Bank UTR confirmed</span>
              </div>
              <span className="text-xl font-mono font-black text-emerald-800">
                {stats?.paidRegistrations ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <strong className="text-amber-950 block">Awaiting Verification</strong>
                <span className="text-amber-700 text-[11px]">Pending organizer review</span>
              </div>
              <span className="text-xl font-mono font-black text-amber-800">
                {stats?.pendingPayments ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
              <div>
                <strong className="text-rose-950 block">Rejected / Disputed</strong>
                <span className="text-rose-700 text-[11px]">Invalid UTR / receipt</span>
              </div>
              <span className="text-xl font-mono font-black text-rose-800">
                {stats?.rejectedPayments ?? 0}
              </span>
            </div>
          </div>

          <Link
            href="/admin/payments"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Open Payment Verification Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
          <Link
            href="/admin/registrations"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
          >
            <span>View All Registrations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentRegistrations && stats.recentRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Registration ID</th>
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Events</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentRegistrations.map((item: any) => (
                  <tr key={item.registrationId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-teal-700">
                      {item.registrationId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.events.length} contest{item.events.length > 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">₹{item.amount}</td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No registrations received yet. Database count is 0.
          </div>
        )}
      </div>
    </div>
  );
}
