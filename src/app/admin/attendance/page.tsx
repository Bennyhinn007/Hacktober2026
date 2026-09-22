'use client';

import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Camera,
  CameraOff,
  Clock,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export default function AdminAttendancePage() {
  const [scannerActive, setScannerActive] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateData, setCandidateData] = useState<any | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [marking, setMarking] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{
    type: 'success' | 'duplicate' | 'error';
    message: string;
  } | null>(null);

  const scannerRef = useRef<any>(null);

  // Initialize camera scanner using html5-qrcode
  useEffect(() => {
    let html5QrCode: any = null;

    if (scannerActive) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        try {
          html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                // Extracted QR payload (could be a full verify URL or direct token)
                let token = decodedText;
                if (decodedText.includes('token=')) {
                  token = decodedText.split('token=')[1].split('&')[0];
                }
                setScannerActive(false);
                handleLookup(token);
              },
              () => {
                // ignore scanning frame misses
              }
            )
            .catch((err: any) => {
              console.warn('Camera scan start failed:', err);
              setStatusAlert({
                type: 'error',
                message: 'Could not access camera. Please enter Registration ID manually.',
              });
              setScannerActive(false);
            });
        } catch (e) {
          console.error(e);
        }
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
      }
    };
  }, [scannerActive]);

  const handleLookup = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setStatusAlert(null);
    setCandidateData(null);

    try {
      // Determine if query is a token or registration ID
      let url = '';
      if (query.includes('-') && query.split('-').length >= 3) {
        url = `/api/verify?token=${encodeURIComponent(query.trim())}`;
      } else {
        // Look up by direct registration ID
        url = `/api/registrations/${query.trim().toUpperCase()}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Participant not found');
      }

      // Normalize candidate payload
      if (json.data) {
        setCandidateData(json.data);
        if (json.data.eventIds && json.data.eventIds.length > 0) {
          setSelectedEventId(json.data.eventIds[0]);
        }
      } else if (json.registration) {
        const primary = json.primaryParticipant;
        setCandidateData({
          registrationId: json.registration.registrationId,
          participantName: primary?.fullName || 'Participant',
          college: primary?.college || 'N/A',
          usn: primary?.usn || 'N/A',
          eventIds: json.registration.eventIds,
          events: json.registration.eventIds.map(
            (id: string) => OFFICIAL_EVENTS.find((e) => e.id === id)?.name || id
          ),
          teamName: json.team?.teamName || null,
          paymentStatus: json.registration.paymentStatus,
          attendanceStatus: json.registration.attendanceStatus,
        });
        if (json.registration.eventIds?.length > 0) {
          setSelectedEventId(json.registration.eventIds[0]);
        }
      }
    } catch (err: any) {
      setStatusAlert({ type: 'error', message: err.message || 'Lookup failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresent = async () => {
    if (!candidateData || !selectedEventId) return;
    setMarking(true);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: candidateData.registrationId,
          participantId: candidateData.usn || candidateData.participantName,
          eventId: selectedEventId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to mark attendance');
      }

      if (json.alreadyMarked) {
        setStatusAlert({
          type: 'duplicate',
          message: `DUPLICATE ALERT: Attendance was ALREADY recorded for this event on ${new Date(
            json.attendance.markedAt
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${json.attendance.markedBy}!`,
        });
      } else {
        setStatusAlert({
          type: 'success',
          message: `SUCCESS: Marked PRESENT for ${
            OFFICIAL_EVENTS.find((e) => e.id === selectedEventId)?.name || selectedEventId
          }!`,
        });
      }
    } catch (err: any) {
      setStatusAlert({ type: 'error', message: err.message || 'Error recording attendance' });
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Event Attendance & QR Check-in
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Scan participant QR badges using your camera or enter Registration IDs for instant check-in.
        </p>
      </div>

      {/* Input Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Manual ID Search Box */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Manual Registration ID Lookup
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. HT26-9E4K27"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup(inputQuery)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={() => handleLookup(inputQuery)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Camera Scanner Trigger */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-700 block">Camera QR Scanner</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Use your device camera to scan participant passes directly at the entrance desk.
            </p>
          </div>

          <button
            onClick={() => setScannerActive(!scannerActive)}
            className={`mt-3 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
              scannerActive
                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
            }`}
          >
            {scannerActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Close Camera Scanner</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-teal-700" />
                <span>Activate Camera Scanner</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camera Stream Viewport */}
      {scannerActive && (
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-md animate-in fade-in space-y-3 text-center">
          <span className="text-xs font-bold text-slate-700 block">
            Point camera at participant QR pass
          </span>
          <div
            id="qr-reader"
            className="w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-slate-100"
          />
        </div>
      )}

      {/* Alert Status Banner */}
      {statusAlert && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
            statusAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusAlert.type === 'duplicate'
              ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold ring-2 ring-amber-400/20'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusAlert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>{statusAlert.message}</div>
        </div>
      )}

      {/* Participant Inspection & Action Card */}
      {candidateData && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          {/* Top details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Found Registration Record
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                {candidateData.participantName}
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                USN: <strong className="text-slate-800">{candidateData.usn}</strong> • {candidateData.college}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-teal-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {candidateData.registrationId}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  candidateData.paymentStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {candidateData.paymentStatus}
              </span>
            </div>
          </div>

          {/* Event Selection to Check In */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Select Event for Check-in:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidateData.eventIds?.map((eId: string) => {
                const ev = OFFICIAL_EVENTS.find((e) => e.id === eId);
                const isSelected = selectedEventId === eId;
                return (
                  <button
                    key={eId}
                    type="button"
                    onClick={() => setSelectedEventId(eId)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{ev?.name || eId}</div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {ev?.type === 'TEAM' ? 'Team Contest' : 'Individual Contest'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Big Action: Mark Present */}
          <div className="pt-2">
            <button
              onClick={handleMarkPresent}
              disabled={marking || !selectedEventId}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {marking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Attendance...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  <span>
                    MARK PRESENT for{' '}
                    {OFFICIAL_EVENTS.find((e) => e.id === selectedEventId)?.name || 'Event'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
