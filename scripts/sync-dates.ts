// Native env loaded via node --env-file=.env.local


import { dbRepository } from '../src/lib/db/repository-selector';
import { EVENT_INFO, INITIAL_SCHEDULE } from '../src/lib/constants';

async function main() {
  console.log('Connecting to database and updating eventInfo & schedule...');
  const current = await dbRepository.getSettings();
  console.log('Current keys in DB:', Object.keys(current));

  const updatedEventInfo = {
    ...EVENT_INFO,
    ...((current.eventInfo as Record<string, unknown>) || {}),
    dates: '3 & 5 October 2026',
    datesShort: '3 & 5 October 2026',
    startDate: '2026-10-03T09:00:00+05:30',
    endDate: '2026-10-05T18:00:00+05:30',
  };

  await dbRepository.updateSetting('eventInfo', updatedEventInfo, 'system@gndec.ac.in');
  console.log('✓ Updated eventInfo with dates: "3 & 5 October 2026"');

  // Also update schedule to 2-day schedule for 3 & 5 October
  await dbRepository.updateSetting('schedule', INITIAL_SCHEDULE, 'system@gndec.ac.in');
  console.log('✓ Updated schedule to 2-day schedule (3 & 5 October 2026)');

  const refreshed = await dbRepository.getSettings();
  console.log('Refreshed eventInfo dates:', (refreshed.eventInfo as any)?.dates);
  console.log('Refreshed schedule days:', (refreshed.schedule as any)?.map((d: any) => `${d.day}: ${d.date}`));
  process.exit(0);
}

main().catch((err) => {
  console.error('Error running sync-dates:', err);
  process.exit(1);
});
