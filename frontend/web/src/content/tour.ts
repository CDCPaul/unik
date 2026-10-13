import type { Category } from '@unik/shared/domain';

export const PACKAGES: { category: Category; title: string; description: string }[] = [
  { category: 'full', title: 'Full Marathon Runner', description: 'Race entry for the 42.195 km full marathon.' },
  { category: 'tenK', title: '10K Runner', description: 'Race entry for the 10 km course.' },
  { category: 'companion', title: 'Companion', description: 'For family and friends coming to cheer. No race entry.' },
  { category: 'child', title: 'Child (under 12)', description: 'For children aged 2–11 travelling with an adult. No race entry.' },
  { category: 'infant', title: 'Infant (under 2)', description: 'For infants under 2 travelling with an adult. No race entry.' },
];

export const INCLUSIONS = [
  'Round-trip flights from Manila or Cebu',
  '3 nights hotel in Seoul with breakfast (twin share)',
  'Race entry and bib for runners',
  'Meals and admission fees as listed in the itinerary',
  'Airport transfers and tour bus',
  'English-speaking tour guide',
  'Group sessions with Artjoy Torregosa',
  'One bottle of water per person per day on the bus',
];

export const EXCLUSIONS = [
  'Korean visa fees',
  'Travel insurance',
  'Guide tips (USD 10 per person per day)',
  'Drinks during meals',
  'Meals not listed in the itinerary',
  'Personal expenses',
];

export const ITINERARY = [
  {
    day: 'DAY 1',
    title: 'Fri 19 Mar · Arrive in Seoul.',
    detail:
      'Land at Incheon International Airport and meet your tour guide. Nami Island, Seokchon Lake and the COEX Starfield Library, then hotel check-in. Meals: breakfast (sandwich), lunch (dak galbi), dinner (gamjatang).',
  },
  {
    day: 'DAY 2',
    title: 'Sat 20 Mar · Warm-up run on the Han River.',
    detail:
      'Shakeout run with Artjoy along the Han River, then Eunpyeong Hanok Village, a ginseng shop and Cheonggyecheon Stream. Meals: hotel breakfast, lunch (samgyetang), dinner (pork BBQ).',
  },
  {
    day: 'DAY 3',
    title: 'Sun 21 Mar · Race day: Seoul Marathon 2027.',
    detail:
      'After the race, relax at a Korean sauna, visit a cosmetics outlet and ride the N Seoul Tower cable car. Meals: hotel breakfast, lunch (galbitang), dinner (samgyeopsal).',
  },
  {
    day: 'DAY 4',
    title: 'Mon 22 Mar · City tour and flight home.',
    detail:
      'Hotel check-out, then Gyeongbokgung Palace, Myeongdong shopping street, the Seaweed Museum with DIY kimbap and a premium outlet before the transfer to Incheon International Airport for your flight home. Meals: hotel breakfast, lunch (shabu-shabu).',
  },
];
export const ITINERARY_NOTE =
  'Flights from Manila leave the night of 18 Mar (after 11 pm); flights from other cities leave early on 19 Mar (around 1 am). All groups fly home on 22 Mar. Times and stops may change with the flight schedule, weather and traffic.';
