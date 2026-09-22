'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, QrCode, Mail, Phone, Sparkles } from 'lucide-react';
import { EVENT_INFO } from '@/lib/constants';

export default function AdminSettingsPage() {
  const [eventInfo, setEventInfo] = useState<any>(EVENT_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.success && json.data.eventInfo) {
          setEventInfo(json.data.eventInfo);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'eventInfo', value: eventInfo }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('System settings and placeholders updated successfully.');
      }
    } catch (err: any) {
      setMsg(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure payment UPI identifiers, helpline contacts, and prize notices without modifying source code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Settings</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Credentials Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <QrCode className="w-4 h-4 text-teal-600" />
            <span>Payment Gateway Credentials</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Official Payment UPI ID
              </label>
              <input
                type="text"
                value={eventInfo.paymentUpiId || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, paymentUpiId: e.target.value })}
                placeholder="[TBD] or gndec@upi"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Shown to participants on Step 4 of the registration wizard.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Online Payment Gateway URL / Link
              </label>
              <input
                type="text"
                value={eventInfo.paymentLink || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, paymentLink: e.target.value })}
                placeholder="[TBD] or https://pay.example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Mail className="w-4 h-4 text-teal-600" />
            <span>Helpdesk & Communications</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Support Email</label>
              <input
                type="text"
                value={eventInfo.contactEmail || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, contactEmail: e.target.value })}
                placeholder="[TBD] or hacktober@gndec.ac.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Organizer Helpline Phone</label>
              <input
                type="text"
                value={eventInfo.contactPhone || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, contactPhone: e.target.value })}
                placeholder="[TBD] or +91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Prize Announcements Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Prize Announcement Configuration</span>
          </div>

          <div className="text-xs space-y-1">
            <label className="font-bold text-slate-700 block mb-1">
              Public Prize Announcement Notice
            </label>
            <input
              type="text"
              value={eventInfo.prizeNotice || ''}
              onChange={(e) => setEventInfo({ ...eventInfo, prizeNotice: e.target.value })}
              placeholder="Prizes will be announced as a surprise."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Displayed prominently on public website hero and badges.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
