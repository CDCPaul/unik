import { FULL_MARATHON_AGE_NOTICE } from '@unik/shared/domain';
import type { Category } from '@unik/shared/domain';

export const PACKAGES: { category: Category; title: string; description: string; notice?: string }[] = [
  {
    category: 'full',
    title: 'Full Marathon Runner',
    description: 'Race entry for the 42.195 km full marathon.',
    notice: FULL_MARATHON_AGE_NOTICE,
  },
  { category: 'tenK', title: '10K Runner', description: 'Race entry for the 10 km course.' },
  { category: 'companion', title: 'Companion', description: 'Cheering members: family and friends coming along to cheer. No race entry.' },
  {
    category: 'childTenK',
    title: 'Child 10K Runner (with bed)',
    description: 'Race entry for the 10 km course for children aged 2–11. Shares a twin room with bed.',
  },
  {
    category: 'childTenKNoBed',
    title: 'Child 10K Runner (no bed)',
    description: "Race entry for the 10 km course for children aged 2–11. Shares a parent's bed (no extra bed).",
  },
  {
    category: 'child',
    title: 'Child (with bed)',
    description: 'Cheering children aged 2–11 travelling with an adult. No race entry. Shares a twin room with bed.',
  },
  {
    category: 'childNoBed',
    title: 'Child (no bed)',
    description: "Cheering children aged 2–11 travelling with an adult. No race entry. Shares a parent's bed (no extra bed).",
  },
  { category: 'infant', title: 'Infant (under 2)', description: 'For infants under 2 travelling with an adult. No race entry.' },
];

export const INCLUSIONS = [
  'Round-trip international airfare on Jin Air or Jeju Air (10 kg hand-carry, 15 kg check-in baggage)',
  '3 nights hotel in Seoul with breakfast (twin share)',
  'Seoul Marathon race entry fee and race kit for runners',
  'Meals as per itinerary',
  'All admission fees and transportation',
  'English-speaking tour guide',
  'One bottle of water per person per day',
  'Run and tour Korea with Artjoy Torregosa',
];

export const EXCLUSIONS = [
  'Philippine travel tax (PHP 1,620)',
  'Driver and guide tips (USD 5 per day × 4 days = USD 20)',
  'Drinks during meals',
  'Travel insurance',
  'Visa processing fee',
  'Personal expenses',
];

export const ITINERARY = [
  {
    day: 'DAY 1',
    title: 'Fri 19 Mar · Arrive in Seoul.',
    detail:
      'Arrive at Incheon International Airport and meet your English-speaking tour guide. Seokchon Lake, COEX Mall and the Starfield Library, Eunpyeong Hanok Village and Hongdae shopping street. Meals: breakfast, lunch and dinner.',
  },
  {
    day: 'DAY 2',
    title: 'Sat 20 Mar · Shake-out run and race kit claiming.',
    detail:
      'Han River shake-out run with Coach Arvin, Gyeongbokgung Palace with hanbok wearing, Cheonggyecheon Stream, a ginseng shop and Dongdaemun Design Plaza, then claim your marathon race kit. Meals: breakfast, lunch and dinner.',
  },
  {
    day: 'DAY 3',
    title: 'Sun 21 Mar · Race day: Seoul Marathon 2027.',
    detail: 'Run the Seoul Marathon, then visit a cosmetics outlet and Myeongdong shopping street. Meals: breakfast, lunch and dinner.',
  },
  {
    day: 'DAY 4',
    title: 'Mon 22 Mar · N Seoul Tower and flight home.',
    detail:
      'N Seoul Tower with cable car ride, the Seaweed Museum with kimbap making and a local supermarket, then departure from Incheon International Airport. Meals: breakfast and lunch (dinner not included).',
  },
];
export const ITINERARY_NOTE =
  'Flights from Tagbilaran (Bohol) leave the night of 18 Mar; flights from Cebu and Clark leave early on 19 Mar. All groups fly home on 22 Mar. Times and stops may change with the flight schedule, weather and traffic.';
