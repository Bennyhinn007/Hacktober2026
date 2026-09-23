import Navbar from '@/components/public/Navbar';
import Hero from '@/components/public/Hero';
import EventCards from '@/components/public/EventCards';
import ScheduleTimeline from '@/components/public/ScheduleTimeline';
import RulesSection from '@/components/public/RulesSection';
import FaqSection from '@/components/public/FaqSection';
import Footer from '@/components/public/Footer';
import { dbRepository } from '@/lib/db/repository-selector';
import {
  EVENT_INFO,
  INITIAL_SCHEDULE,
  INITIAL_PRICING_CONFIG,
  PricingTierConfig,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let eventInfo = EVENT_INFO;
  let schedule = INITIAL_SCHEDULE;
  let pricing = INITIAL_PRICING_CONFIG;

  try {
    const settings = await dbRepository.getSettings();
    if (settings) {
      if (settings.eventInfo && typeof settings.eventInfo === 'object') {
        eventInfo = {
          ...EVENT_INFO,
          ...(settings.eventInfo as Record<string, any>),
        };
      }
      if (settings.schedule && Array.isArray(settings.schedule)) {
        schedule = settings.schedule as typeof INITIAL_SCHEDULE;
      }
      if (settings.pricing && typeof settings.pricing === 'object') {
        pricing = settings.pricing as Record<number, PricingTierConfig>;
      }
    }
  } catch (err) {
    console.error('[HomePage] Failed to fetch settings, using fallback constants:', err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero initialEventInfo={eventInfo} />
        <EventCards initialPricing={pricing} />
        <ScheduleTimeline initialSchedule={schedule} initialEventInfo={eventInfo} />
        <RulesSection />
        <FaqSection initialEventInfo={eventInfo} />
      </main>
      <Footer initialEventInfo={eventInfo} />
    </div>
  );
}

