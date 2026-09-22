'use client';

import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, AlertCircle, Save, Loader2, Info } from 'lucide-react';
import type { PricingTierConfig } from '@/lib/constants';

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<Record<number, PricingTierConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.success && json.data.pricing) {
          setPricing(json.data.pricing);
        }
      } catch (err) {
        console.error('Error loading pricing settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handlePriceChange = (count: number, value: string) => {
    if (!pricing) return;
    const num = value === '' ? null : parseInt(value, 10);
    setPricing({
      ...pricing,
      [count]: {
        ...pricing[count],
        price: isNaN(num as number) ? null : num,
        status: num !== null && !isNaN(num) ? 'ACTIVE' : 'TBD',
      },
    });
  };

  const handleSave = async () => {
    if (!pricing) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'pricing', value: pricing }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ type: 'success', text: 'Dynamic pricing tiers updated successfully.' });
      } else {
        setMsg({ type: 'error', text: json.error || 'Failed to update pricing.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Save error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !pricing) {
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Centralized Pricing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic registration fee tiers for 1, 2, 3, 4, and 5 events.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
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

      {/* Info notice about pricing tiers */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block">Dynamic Pricing Tier Matrix:</strong>
          <p>
            All 5 event combinations are currently active: 1 Event (₹79), 2 Events (₹150), 3 Events (₹199), 4 Events (₹300), and 5 Events (₹350). You can adjust prices or mark any tier as TBD at any time, and changes apply instantly without code deployment.
          </p>
        </div>
      </div>

      {/* Pricing Cards List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((count) => {
          const tier = pricing[count];
          const isTbd = !tier || tier.status === 'TBD' || tier.price === null;

          return (
            <div
              key={count}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                isTbd ? 'border-dashed border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {count} Event{count > 1 ? 's' : ''} Package
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isTbd
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isTbd ? 'STATUS: UNFINALIZED (TBD)' : 'STATUS: ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isTbd
                    ? 'Displays "Pricing for this combination will be confirmed by organizers" and blocks registration.'
                    : `Active registration price of ₹${tier.price}.`}
                </p>
              </div>

              {/* Price input */}
              <div className="flex items-center gap-2 sm:w-48">
                <span className="text-sm font-bold text-slate-700">₹</span>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 149"
                  value={tier?.price ?? ''}
                  onChange={(e) => handlePriceChange(count, e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
