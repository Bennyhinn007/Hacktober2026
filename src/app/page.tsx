import Navbar from '@/components/public/Navbar';
import Hero from '@/components/public/Hero';
import EventCards from '@/components/public/EventCards';
import ScheduleTimeline from '@/components/public/ScheduleTimeline';
import RulesSection from '@/components/public/RulesSection';
import FaqSection from '@/components/public/FaqSection';
import Footer from '@/components/public/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <EventCards />
        <ScheduleTimeline />
        <RulesSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
