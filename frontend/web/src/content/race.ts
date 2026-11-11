export const RACE = {
  name: 'Seoul Marathon 2027',
  edition: 'The 97th Dong-A Marathon',
  date: 'Sunday, March 21, 2027',
  dateShort: 'MARCH 21, 2027',
  city: 'Seoul, South Korea',
  categories: [
    { key: 'full', label: 'Full Marathon', distance: '42.195 km', assembly: 'Gwanghwamun Square (planned)' },
    { key: 'tenK', label: '10K', distance: '10 km', assembly: 'Jamsil Sports Complex (planned)' },
  ],
  courseNote: 'In 2026 the full marathon ran from Gwanghwamun Square to Jamsil Sports Complex, and the 10K started and finished at Jamsil Sports Complex. The official 2027 course map will be released by the organizers.',
  timeLimit: 'Full marathon 5 hours, 10K 1 hour 30 minutes, strictly applied by the organizers.',
  officialSite: 'https://www.seoul-marathon.com',
  bibsTotal: 200,
} as const;
