import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import ScheduleTimeline from '@/components/public/ScheduleTimeline';

export const metadata = {
  title: 'Event Schedule | Hacktober 2026 | GNDEC Bidar',
  description: 'Official 3-day itinerary and timeline for Hacktober 2026 (3–5 October 2026).',
};

export default function SchedulePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              3–5 October 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Event Timeline & Itinerary
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Follow session milestones across 3 days at Guru Nanak Dev Engineering College, Bidar.
            </p>
          </div>
        </div>
        <ScheduleTimeline />
      </main>
      <Footer />
    </div>
  );
}
