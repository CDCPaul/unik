'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Check, X, Plane, Hotel, 
  Utensils, Bus, Ticket, Camera, Star, ArrowRight 
} from 'lucide-react';

const itinerary = [
  {
    day: 1,
    date: 'January 15, 2026',
    title: 'Arrival in Seoul',
    activities: [
      'Arrival at Incheon International Airport',
      'Airport pickup and transfer to hotel',
      'Check-in at 4-star hotel in Seoul',
      'Welcome dinner with fellow travelers',
      'Free time to explore nearby areas',
    ],
  },
  {
    day: 2,
    date: 'January 16, 2026',
    title: 'City Tour & Game Day 1',
    activities: [
      'Breakfast at hotel',
      'Morning Seoul city tour (Gyeongbokgung Palace)',
      'Lunch at traditional Korean restaurant',
      'Free time for shopping at Myeongdong',
      'KBL All-Star Game - Night Session',
      'Return to hotel',
    ],
  },
  {
    day: 3,
    date: 'January 17, 2026',
    title: 'Meet & Greet + Game Day 2',
    activities: [
      'Breakfast at hotel',
      'Exclusive Meet & Greet with Filipino players',
      'Photo opportunity and autograph session',
      'Lunch',
      'KBL All-Star Game - Main Event',
      'Farewell dinner celebration',
    ],
  },
  {
    day: 4,
    date: 'January 18, 2026',
    title: 'Departure',
    activities: [
      'Breakfast at hotel',
      'Check-out and luggage storage',
      'Optional morning shopping/sightseeing',
      'Transfer to Incheon International Airport',
      'Departure to Manila',
    ],
  },
];

const inclusions = [
  { icon: Plane, text: 'Round-trip airfare (Manila - Seoul - Manila)' },
  { icon: Hotel, text: '3 nights accommodation at 4-star hotel' },
  { icon: Utensils, text: 'Daily breakfast + 2 special dinners' },
  { icon: Bus, text: 'All airport transfers and city tours' },
  { icon: Ticket, text: 'KBL All-Star Game tickets (2 sessions)' },
  { icon: Star, text: 'Exclusive Meet & Greet with Filipino players' },
  { icon: Camera, text: 'Professional tour guide' },
];

const exclusions = [
  'Travel insurance (highly recommended)',
  'Personal expenses and tips',
  'Meals not mentioned in itinerary',
  'Korean visa (if applicable)',
  'Optional activities not in the package',
];

export default function TourPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-900" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              All-Inclusive Package
            </span>
            <h1 className="section-heading mt-4 mb-6">
              Tour Package Details
            </h1>
            <p className="text-dark-400 text-lg mb-8">
              Everything you need for the ultimate basketball experience in Korea.
              4 days of adventure, basketball, and unforgettable memories.
            </p>
            
            {/* Price Badge */}
            <div className="inline-block card-premium p-6 px-10">
              <div className="text-gold-400 text-sm uppercase tracking-wider mb-1">
                Starting From
              </div>
              <div className="text-4xl font-display font-bold text-white">
                ₱ XX,XXX
              </div>
              <div className="text-dark-400 text-sm mt-1">per person</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="py-6 bg-dark-950 border-y border-dark-800">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-dark-300">
              <Calendar className="w-5 h-5 text-gold-500" />
              <span>Jan 15-18, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <Clock className="w-5 h-5 text-gold-500" />
              <span>4 Days / 3 Nights</span>
            </div>
            <div className="flex items-center gap-2 text-dark-300">
              <MapPin className="w-5 h-5 text-gold-500" />
              <span>Seoul, South Korea</span>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary Section */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16">
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Day by Day
            </span>
            <h2 className="section-heading mt-4">Tour Itinerary</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            {itinerary.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 pb-12 last:pb-0"
              >
                {/* Timeline line */}
                {index < itinerary.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-dark-700" />
                )}
                
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gold-500 
                               flex items-center justify-center">
                  <span className="text-xs font-bold text-dark-900">{day.day}</span>
                </div>

                {/* Content */}
                <div className="card p-6 ml-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <div className="text-gold-400 text-sm font-medium">
                        Day {day.day} • {day.date}
                      </div>
                      <h3 className="text-xl font-semibold text-white mt-1">
                        {day.title}
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {day.activities.map((activity, i) => (
                      <li key={i} className="flex items-start gap-3 text-dark-300">
                        <ArrowRight className="w-4 h-4 text-gold-500 mt-1 flex-shrink-0" />
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inclusions & Exclusions */}
      <section className="py-24 bg-dark-950">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Inclusions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card-premium p-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                Package Includes
              </h3>
              <ul className="space-y-4">
                {inclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gold-400" />
                    </div>
                    <span className="text-dark-300 pt-1">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Exclusions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card p-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                Not Included
              </h3>
              <ul className="space-y-4">
                {exclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-4 text-dark-400">
                    <X className="w-5 h-5 text-dark-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="section-heading mb-6">Ready to Join?</h2>
            <p className="text-dark-400 text-lg mb-8">
              Secure your spot now for this once-in-a-lifetime basketball experience.
              Limited slots available.
            </p>
            <Link href="/register" className="btn-gold text-lg px-10 py-4">
              <Ticket className="w-5 h-5 mr-2" />
              Book Now
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

