import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import RulesSection from '@/components/public/RulesSection';

export const metadata = {
  title: 'Official Rules & Code of Conduct | Hacktober 2026',
  description: 'Official regulations, eligibility terms, cyber ethics, and conduct guidelines for Hacktober 2026.',
};

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Ethical Conduct & Guidelines
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Event Rules & Regulations
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
              Please review all institutional, event-specific, and cyber law compliance standards before registering.
            </p>
          </div>
        </div>
        <RulesSection />
      </main>
      <Footer />
    </div>
  );
}
