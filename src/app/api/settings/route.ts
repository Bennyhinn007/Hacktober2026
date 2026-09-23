import { NextResponse } from 'next/server';
import { dbRepository } from '@/lib/db/repository-selector';
import {
  EVENT_INFO,
  INITIAL_SCHEDULE,
  INITIAL_PRICING_CONFIG,
  OFFICIAL_EVENTS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await dbRepository.getSettings();

    const eventInfo = {
      ...EVENT_INFO,
      ...((settings.eventInfo as Record<string, unknown>) || {}),
    };
    const schedule = settings.schedule || INITIAL_SCHEDULE;
    const pricing = settings.pricing || INITIAL_PRICING_CONFIG;

    return NextResponse.json(
      {
        success: true,
        data: {
          eventInfo,
          schedule,
          pricing,
          events: OFFICIAL_EVENTS,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    console.error('[API /api/settings] Error fetching public settings:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          eventInfo: EVENT_INFO,
          schedule: INITIAL_SCHEDULE,
          pricing: INITIAL_PRICING_CONFIG,
          events: OFFICIAL_EVENTS,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}
