'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader2, Shield } from 'lucide-react';
import { OFFICIAL_EVENTS } from '@/lib/constants';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetch('/api/admin/teams');
        const json = await res.json();
        if (json.success) {
          setTeams(json.data || []);
        }
      } catch (err) {
        console.error('Error loading teams:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  const filteredTeams = teams.filter((t) => {
    const q = search.toLowerCase();
    const teamMatch = t.team.teamName.toLowerCase().includes(q);
    const leaderMatch = t.leader?.fullName.toLowerCase().includes(q);
    const regMatch = t.team.registrationId.toLowerCase().includes(q);
    return teamMatch || leaderMatch || regMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered team rosters for Mini Hackathon and Cyber Hunt (Maximum 4 members per team).
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search teams or leaders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((t) => {
            const ev = OFFICIAL_EVENTS.find((e) => e.id === t.team.eventId);
            const totalMembers = 1 + (t.members?.length || 0);

            return (
              <div
                key={t.team.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{t.team.teamName}</h3>
                    <span className="text-xs text-teal-700 font-semibold">{ev?.name}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-slate-700 block">
                      {t.team.registrationId}
                    </span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.paymentStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Leader Details */}
                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Team Leader:
                  </span>
                  <div className="font-semibold text-slate-900">
                    {t.leader?.fullName || 'Leader'}
                    <span className="text-slate-500 font-mono font-normal ml-2">
                      ({t.leader?.usn})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.leader?.email} • {t.leader?.phone}
                  </div>
                </div>

                {/* Additional Members */}
                <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Members ({totalMembers} / 4 max):
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {t.members && t.members.length > 0 ? (
                      t.members.map((m: any, idx: number) => (
                        <div
                          key={m.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{m.fullName}</span>
                            <span className="font-mono text-slate-500 text-[11px] ml-2">
                              {m.usn}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Member {idx + 2}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Solo leader registered (up to 3 team slots remaining).
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          No teams found in database.
        </div>
      )}
    </div>
  );
}
