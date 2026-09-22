import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { GENERAL_RULES, DISQUALIFICATION_DISCLAIMER } from '@/lib/constants';

export default function RulesSection() {
  return (
    <section id="rules" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
            <span>Code of Conduct</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rules & Regulations
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Adherence to technical ethics and college guidelines is mandatory for all registered participants.
          </p>
        </div>

        {/* 12 Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {GENERAL_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {rule}
              </p>
            </div>
          ))}
        </div>

        {/* Organizer Disclaimer Banner */}
        <div className="mt-8 max-w-5xl mx-auto p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Organizer Notice:</span>
            <p>{DISQUALIFICATION_DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
