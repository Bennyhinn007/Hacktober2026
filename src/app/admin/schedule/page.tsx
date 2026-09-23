'use client';

import { useState, useEffect } from 'react';
import { Calendar, Save, Loader2, CheckCircle2, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

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

  const handleDayChange = (dayIdx: number, field: string, val: string) => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated[dayIdx][field] = val;
    setSchedule(updated);
  };

  const handleItemChange = (dayIdx: number, itemIdx: number, field: string, val: string) => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated[dayIdx].items[itemIdx][field] = val;
    setSchedule(updated);
  };

  const handleAddItem = (dayIdx: number) => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated[dayIdx].items.push({
      event: 'New Session / Competition',
      time: '10:00 AM',
      venue: 'GNDEC Bidar',
      type: 'EVENT',
    });
    setSchedule(updated);
  };

  const handleDeleteItem = (dayIdx: number, itemIdx: number) => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated[dayIdx].items.splice(itemIdx, 1);
    setSchedule(updated);
  };

  const handleAddDay = () => {
    if (!schedule) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    const nextDayNum = updated.length + 1;
    updated.push({
      day: `Day ${nextDayNum}`,
      date: '5 October 2026',
      items: [
        {
          event: 'New Session',
          time: '10:00 AM',
          venue: 'GNDEC Bidar',
          type: 'EVENT',
        },
      ],
    });
    setSchedule(updated);
  };

  const handleDeleteDay = (dayIdx: number) => {
    if (!schedule || schedule.length <= 1) return;
    if (!confirm(`Are you sure you want to remove ${schedule[dayIdx].day}?`)) return;
    const updated = JSON.parse(JSON.stringify(schedule));
    updated.splice(dayIdx, 1);
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
        setMsg('Schedule timeline and dates updated successfully.');
      } else {
        setMsg(json.error || 'Failed to update schedule');
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
            Update official dates (e.g. 3 & 5 October 2026), timings, and room numbers for Hacktober 2026 sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddDay}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Day</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Schedule</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Schedule Groups */}
      <div className="space-y-6">
        {schedule.map((dayGroup, dIdx) => (
          <div
            key={dIdx}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4"
          >
            {/* Day Header with Editable Day Label & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <input
                  type="text"
                  value={dayGroup.day || ''}
                  onChange={(e) => handleDayChange(dIdx, 'day', e.target.value)}
                  placeholder="Day 1"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 w-28 bg-slate-50 focus:bg-white"
                />
                <span className="text-slate-400 font-bold">—</span>
                <input
                  type="text"
                  value={dayGroup.date || ''}
                  onChange={(e) => handleDayChange(dIdx, 'date', e.target.value)}
                  placeholder="3 October 2026"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 w-44 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem(dIdx)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Session</span>
                </button>
                {schedule.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteDay(dIdx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete this entire day"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Session Items */}
            <div className="space-y-3">
              {dayGroup.items.map((item: any, iIdx: number) => (
                <div
                  key={iIdx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <input
                      type="text"
                      value={item.event}
                      onChange={(e) => handleItemChange(dIdx, iIdx, 'event', e.target.value)}
                      placeholder="Session or Event Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-bold text-slate-900"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">TYPE:</span>
                      <select
                        value={item.type || 'EVENT'}
                        onChange={(e) => handleItemChange(dIdx, iIdx, 'type', e.target.value)}
                        className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold bg-white"
                      >
                        <option value="EVENT">EVENT</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                    </div>
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

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(dIdx, iIdx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
