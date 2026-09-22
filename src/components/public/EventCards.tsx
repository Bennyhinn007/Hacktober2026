'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  MessageSquareText,
  Terminal,
  ShieldAlert,
  Bug,
  Users,
  User,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
} from 'lucide-react';
import { OFFICIAL_EVENTS, EventDefinition } from '@/lib/constants';

const ICON_MAP: Record<string, React.ReactNode> = {
  BrainCircuit: <BrainCircuit className="w-6 h-6 text-teal-600" />,
  MessageSquareText: <MessageSquareText className="w-6 h-6 text-blue-600" />,
  Terminal: <Terminal className="w-6 h-6 text-emerald-600" />,
  ShieldAlert: <ShieldAlert className="w-6 h-6 text-indigo-600" />,
  Bug: <Bug className="w-6 h-6 text-rose-600" />,
};

export default function EventCards() {
  const [selectedEvent, setSelectedEvent] = useState<EventDefinition | null>(null);

  return (
    <section id="events" className="py-16 lg:py-24 bg-slate-50/80 border-b border-slate-200 relative bg-cyber-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-3">
            <span>5 Official Contests</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Challenge Your Technical Intellect
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Engineered by the Department of CSE & Cybersecurity to test offensive capabilities, logic precision, defensive strategy, and team hackathon execution.
          </p>

          {/* Pricing Info Banner */}
          <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700 cyber-corner">
            <span className="text-slate-500 font-medium">Official Pricing Tiers:</span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
              1 Event: <strong>₹79</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
              2 Events: <strong>₹150</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-900 border border-teal-200">
              3 Events: <strong>₹199</strong> (Popular)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
              4 Events: <strong>₹300</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200">
              All 5 Events: <strong>₹350</strong> (Best Value)
            </span>
          </div>
        </div>

        {/* 5 Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {OFFICIAL_EVENTS.map((event) => {
            const isTeam = event.type === 'TEAM';
            return (
              <div
                key={event.id}
                className="group rounded-2xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs card-hover flex flex-col justify-between relative overflow-hidden cyber-corner"
              >
                {/* Top Accent Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isTeam ? 'bg-gradient-to-r from-teal-500 to-indigo-500' : 'bg-slate-900'
                  }`}
                />

                <div className="space-y-4">
                  {/* Icon & Participation Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {ICON_MAP[event.icon]}
                    </div>
                    <div>
                      {isTeam ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                          <Users className="w-3.5 h-3.5" />
                          <span>Team Event (Offline Groups)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                          <User className="w-3.5 h-3.5" />
                          <span>Individual (1 Person)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Short Description */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {event.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {event.shortDescription}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Venue:</span>
                      <span className="font-semibold text-slate-700">{event.venue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Time:</span>
                      <span className="font-semibold text-slate-700">{event.time}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-teal-600" />
                    <span>View Details & Rules</span>
                  </button>
                  <Link
                    href={`/register?event=${event.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs"
                  >
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {ICON_MAP[selectedEvent.icon]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedEvent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedEvent.type === 'TEAM'
                        ? 'Team (Max 4 members per team)'
                        : 'Individual Event'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Event Overview
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedEvent.description}</p>
            </div>

            {/* Event Rules */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Event-Specific Rules
              </h4>
              <ul className="space-y-2">
                {selectedEvent.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">Eligibility:</span>
              <p>{selectedEvent.eligibility}</p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <Link
                href={`/register?event=${selectedEvent.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
              >
                <span>Register for this Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
