'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'qrcode';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import {
  ShieldCheck,
  Printer,
  Download,
  Home,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  QrCode as QrIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { OFFICIAL_EVENTS, EVENT_INFO } from '@/lib/constants';

interface ConfirmationData {
  registration: {
    registrationId: string;
    eventIds: string[];
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  };
  primaryParticipant: {
    fullName: string;
    email: string;
    phone: string;
    usn: string;
    college: string;
    department: string;
    yearSemester: string;
  };
  team?: {
    teamName: string;
    members: Array<{ fullName: string; usn: string; isPrimary: boolean }>;
  } | null;
  payment?: {
    transactionId: string;
    amount: number;
    status: string;
  } | null;
  safeToken: string;
}

export default function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<ConfirmationData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`/api/registrations/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Registration not found');
        }
        setData(json);

        // Generate QR code with safe verification URL
        const verifyUrl = `${window.location.origin}/verify?token=${json.safeToken}`;
        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(qr);
      } catch (err: any) {
        setError(err.message || 'Unable to load registration details');
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Generating Registration Pass...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Registration Not Found</h2>
            <p className="text-xs text-slate-600">{error || 'Invalid registration ID.'}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { registration, primaryParticipant, team, payment } = data;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="flex-1 py-10 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Banner (Screen Only) */}
          <div className="no-print text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Registration Successful</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Official Participant Pass
            </h1>
            <p className="text-xs text-slate-500">
              Please download or print this badge. Present the QR pass at GNDEC Bidar on 3 October 2026.
            </p>
          </div>

          {/* Action Bar (Screen Only) */}
          <div className="no-print flex items-center justify-between gap-3 mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-teal-700 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Badge</span>
              </button>
            </div>
          </div>

          {/* Official Pass Card (Printable) */}
          <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-md p-6 sm:p-8 space-y-6 print-badge relative overflow-hidden">
            {/* Watermark Pattern */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-slate-100 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Header: Institution & Logo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-200 gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-teal-50 border border-teal-200 shrink-0 shadow-2xs">
                  <Image
                    src="/logo-circle.png"
                    alt="Cyber Samurai Association Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    GNDEC Bidar • Cyber Samurai Association
                  </span>
                  <h2 className="font-mokoto text-lg sm:text-xl text-slate-900 tracking-wider">
                    HACKTOBER 2026 PASS
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {EVENT_INFO.department}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Registration ID
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-teal-700 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200 inline-block mt-0.5">
                  {registration.registrationId}
                </span>
              </div>
            </div>

            {/* Candidate & QR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Candidate Bio Column */}
              <div className="md:col-span-8 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">
                      Participant Name
                    </span>
                    <strong className="text-base text-slate-900 block font-bold mt-0.5">
                      {primaryParticipant.fullName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">
                      USN / Student ID
                    </span>
                    <strong className="text-base text-slate-900 block font-mono font-bold mt-0.5">
                      {primaryParticipant.usn}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">College</span>
                    <span className="text-slate-800 font-medium block mt-0.5">
                      {primaryParticipant.college}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px]">
                      Branch & Year
                    </span>
                    <span className="text-slate-800 font-medium block mt-0.5">
                      {primaryParticipant.department} • {primaryParticipant.yearSemester}
                    </span>
                  </div>
                </div>

                {team && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-semibold block text-[11px]">
                      Team Roster:
                    </span>
                    <strong className="text-slate-900 block text-sm">{team.teamName}</strong>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {team.members.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono"
                        >
                          {m.fullName} ({m.usn})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Badges */}
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px] mb-1.5">
                    Registered Competitions ({registration.eventIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {registration.eventIds.map((id) => {
                      const ev = OFFICIAL_EVENTS.find((e) => e.id === id);
                      return (
                        <span
                          key={id}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200"
                        >
                          {ev?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Secure QR Code Column */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Registration Check-in QR"
                    className="w-40 h-40 rounded-lg shadow-2xs border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-200 rounded-lg animate-pulse" />
                )}
                <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                  SECURE PASS TOKEN
                </span>
                <span className="text-[10px] text-slate-400">Scan at Entry Desk</span>
              </div>
            </div>

            {/* Payment & Attendance Footer */}
            <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Amount Paid
                </span>
                <strong className="text-slate-900 font-mono text-sm">
                  ₹{registration.totalAmount}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Payment Status
                </span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {registration.paymentStatus}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Event Dates
                </span>
                <span className="text-slate-700 font-medium">3–5 Oct 2026</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Venue City
                </span>
                <span className="text-slate-700 font-medium">Bidar, Karnataka</span>
              </div>
            </div>

            {/* Disclaimers & Security Note */}
            <div className="text-[10px] text-slate-400 leading-tight pt-2 border-t border-slate-100 text-center">
              This pass is non-transferable. Valid institutional student ID card required at entry. Issued by Department of CSE, IoT and Cybersecurity, GNDEC Bidar.
            </div>
          </div>
        </div>
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
