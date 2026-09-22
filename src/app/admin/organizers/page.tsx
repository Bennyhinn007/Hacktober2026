'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserX,
} from 'lucide-react';
import type { AdminRole } from '@/lib/db/types';

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organizers');
      const json = await res.json();
      if (json.success) {
        setOrganizers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/organizers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create organizer');
      }

      setMsg({ type: 'success', text: 'Organizer account provisioned successfully.' });
      setShowCreateModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      fetchOrganizers();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error creating organizer' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (adminId: string, newRole: AdminRole) => {
    try {
      const res = await fetch(`/api/admin/organizers/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOrganizers();
      }
    } catch (err) {
      console.error('Role update error:', err);
    }
  };

  const handleToggleActive = async (adminId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/organizers/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        fetchOrganizers();
      }
    } catch (err) {
      console.error('Activation update error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Organizer Role-Based Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision and manage committee admin accounts with granular RBAC permissions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Organizer</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Organizers List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Organizer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Access Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{org.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{org.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={org.role}
                        onChange={(e) => handleRoleChange(org.id, e.target.value as AdminRole)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
                        <option value="ADMIN">ADMIN (Registrations/Attendance)</option>
                        <option value="VIEWER">VIEWER (Read-Only)</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          org.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {org.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(org.id, org.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          org.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {org.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Organizer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Provision New Organizer</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Anand Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anand@gndec.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">System Access Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="ADMIN">ADMIN (Registrations, Payments & Attendance)</option>
                  <option value="VIEWER">VIEWER (Read-Only Observer)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Authority)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Provision Organizer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
