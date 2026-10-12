import type { Category } from '@unik/shared/domain';

export const PACKAGES: { category: Category; title: string; description: string }[] = [
  { category: 'full', title: 'Full Marathon Runner', description: 'Race entry for the 42.195 km full marathon.' },
  { category: 'tenK', title: '10K Runner', description: 'Race entry for the 10 km course.' },
  { category: 'companion', title: 'Companion', description: 'For family and friends coming to cheer. No race entry.' },
];

export const INCLUSIONS = [
  'Round-trip flights from Manila or Cebu [TBC]',
  'Hotel in Seoul [number of nights TBC]',
  'Race entry and bib for runners',
  'Airport and race-day transfers',
  'Group sessions with Artjoy Torregosa',
  'English and Korean-speaking tour staff [TBC]',
];

export const EXCLUSIONS = ['Korean visa fees', 'Travel insurance [TBC]', 'Meals not listed in the itinerary', 'Personal expenses'];

export const ITINERARY = [
  { day: 'DAY 1', title: 'Fly to Seoul.', detail: 'Airport pickup and hotel check-in.' },
  { day: 'DAY 2', title: 'Bib pickup at the race expo.', detail: 'Shakeout run and strategy clinic with Artjoy.' },
  { day: 'DAY 3', title: 'Race day: Seoul Marathon 2027.', detail: 'Finisher dinner in the evening.' },
  { day: 'DAY 4', title: 'Recovery day.', detail: 'Seoul city tour [TBC].' },
  { day: 'DAY 5', title: 'Fly home.', detail: '' },
];
export const ITINERARY_NOTE = 'Draft itinerary, subject to flight schedule.';
