'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { INITIAL_SCHEDULE } from '@/lib/constants';

export default function ScheduleTimeline() {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDay = INITIAL_SCHEDULE[activeDayIndex];

  return (
    <section id="schedule" className="py-16 lg:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
            <span>3-Day Program</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Event Schedule & Itinerary
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hacktober 2026 runs across three intensive days (3–5 October 2026).
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Exact session timings and venues are currently TBD and will be finalized prior to the event.</span>
          </div>
        </div>

        {/* Day Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-xs">
            {INITIAL_SCHEDULE.map((day, idx) => (
              <button
                key={day.day}
                onClick={() => setActiveDayIndex(idx)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeDayIndex === idx
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{day.day}</span>
                <span className="ml-2 text-xs font-normal text-slate-500 hidden sm:inline">
                  ({day.date})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Day Timeline List */}
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>{currentDay.date}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Campus GNDEC Bidar
            </span>
          </div>

          <div className="space-y-3">
            {currentDay.items.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        item.type === 'EVENT'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{item.event}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Time: <strong className="text-slate-700">{item.time}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Venue: <strong className="text-slate-700">{item.venue}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
