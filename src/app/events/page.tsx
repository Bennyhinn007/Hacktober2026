import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import EventCards from '@/components/public/EventCards';

export const metadata = {
  title: 'Events Catalog | Hacktober 2026 | GNDEC Bidar',
  description: 'Explore the 5 signature events of Hacktober 2026: Cybersecurity Quiz, Debate, Mini Hackathon, Cyber Hunt, and Technical Debugging.',
};

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Full Event Specifications
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Official Events & Competitions
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Choose your challenges across individual cybersecurity battles and 4-member collaborative team hackathons.
            </p>
          </div>
        </div>
        <EventCards />
      </main>
      <Footer />
    </div>
  );
}
