'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar,
  Users,
  Home,
  Clock,
} from 'lucide-react';

interface VerifiedPayload {
  registrationId: string;
  participantName: string;
  college: string;
  usn: string;
  events: string[];
  teamName: string | null;
  paymentStatus: string;
  attendanceStatus: string;
  attendanceHistory: Array<{ eventName: string; markedAt: string }>;
}

function PublicVerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifiedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPass() {
      if (!token) {
        setError('No verification token provided in URL.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/verify?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Invalid or revoked verification pass.');
        }
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Pass verification failed.');
      } finally {
        setLoading(false);
      }
    }

    verifyPass();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-teal-200 shadow-sm mx-auto p-0.5">
            <Image
              src="/logo-circle.png"
              alt="Hacktober 2026 Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="font-mokoto text-xl tracking-wider text-slate-900 uppercase">
            HACKTOBER <span className="text-teal-600">2026</span>
          </h1>
          <p className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
            Cyber Samurai Association • Pass Verification
          </p>
          <p className="text-[11px] text-slate-500">
            Guru Nanak Dev Engineering College, Bidar
          </p>
        </div>

        {/* Verification Result Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Verifying Pass Signature...</p>
            </div>
          )}

          {error && (
            <div className="py-8 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Invalid Pass</h2>
              <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-5 animate-in fade-in">
              {/* Authenticity Banner */}
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-2.5 text-teal-900 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                <span>OFFICIAL BADGE VERIFIED</span>
              </div>

              {/* ID & Candidate */}
              <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Registration ID</span>
                  <span className="font-mono font-black text-sm text-teal-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {data.registrationId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Candidate Name</span>
                  <strong className="text-slate-900 text-sm">{data.participantName}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Institution</span>
                  <span className="text-slate-700 font-medium text-right max-w-[200px] truncate">
                    {data.college}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Student USN</span>
                  <span className="font-mono text-slate-800 font-bold">{data.usn}</span>
                </div>

                {data.teamName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Team</span>
                    <span className="font-bold text-slate-900">{data.teamName}</span>
                  </div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">
                    Payment Status
                  </span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      data.paymentStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-900'
                        : data.paymentStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {data.paymentStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] block font-bold uppercase">
                    Attendance
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                    {data.attendanceStatus}
                  </span>
                </div>
              </div>

              {/* Registered Events */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block">Authorized Events:</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.events.map((ev, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-medium text-[11px]"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attendance Log */}
              {data.attendanceHistory && data.attendanceHistory.length > 0 && (
                <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 space-y-1 text-xs">
                  <span className="font-bold text-teal-900 block text-[11px]">
                    Check-in History:
                  </span>
                  {data.attendanceHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-teal-800">
                      <span>{h.eventName}</span>
                      <span className="font-mono text-[10px]">
                        {new Date(h.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Home Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Hacktober 2026 Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="font-medium text-sm">Verifying accreditation pass...</span>
          </div>
        </div>
      }
    >
      <PublicVerifyContent />
    </Suspense>
  );
}
