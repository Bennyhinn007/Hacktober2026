'use client';

import { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2, Clock, MapPin } from 'lucide-react';

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.success && json.data.schedule) {
          setSchedule(json.data.schedule);
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  const handleItemChange = (dayIdx: number, itemIdx: number, field: string, val: string) => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated[dayIdx].items[itemIdx][field] = val;
    setSchedule(updated);
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'schedule', value: schedule }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg('Schedule timeline updated successfully.');
      }
    } catch (err: any) {
      setMsg(err.message || 'Error updating schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !schedule) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Schedule & Venue Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update official timings and room numbers for Hacktober 2026 sessions.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Schedule</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* 3 Days Schedule Groups */}
      <div className="space-y-6">
        {schedule.map((dayGroup, dIdx) => (
          <div
            key={dayGroup.day}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {dayGroup.day} — {dayGroup.date}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {dayGroup.items.length} sessions
              </span>
            </div>

            <div className="space-y-3">
              {dayGroup.items.map((item: any, iIdx: number) => (
                <div
                  key={iIdx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-6">
                    <span className="font-bold text-slate-900 block">{item.event}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      Type: {item.type}
                    </span>
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => handleItemChange(dIdx, iIdx, 'time', e.target.value)}
                      placeholder="e.g. 10:00 AM"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={item.venue}
                      onChange={(e) => handleItemChange(dIdx, iIdx, 'venue', e.target.value)}
                      placeholder="e.g. Lab 304"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
