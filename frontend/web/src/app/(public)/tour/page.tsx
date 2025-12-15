'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, CheckCircle, Plane, Clock, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getActiveTour } from '@/lib/services/tours';
import type { TourPackage } from '@unik/shared/types';

export default function TourPage() {
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getDepartureBadgeText = (t: TourPackage) => {
    if (!t.departures || t.departures.length === 0) return 'TBA';
    const d0 = t.departures[0];
    const originsFromRoutes = (t.flightRoutes || []).map(r => r.origin).filter(Boolean);
    const originsFromOverrides = (d0.datesByOrigin || []).map(x => x.origin).filter(Boolean);
    const origins = Array.from(new Set([...originsFromRoutes, ...originsFromOverrides]));

    if (origins.length > 1 && d0.datesByOrigin && d0.datesByOrigin.length > 0) {
      const parts = origins.map((o) => {
        const m = d0.datesByOrigin?.find(x => x.origin === o);
        const dep = m?.departureDate || d0.departureDate;
        const ret = m?.returnDate || d0.returnDate;
        return `${o}: ${dep} - ${ret}`;
      });
      return parts.join(' • ');
    }
    return `${d0.departureDate} - ${d0.returnDate}`;
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getActiveTour();
        setTour(data);
      } catch (error) {
        console.error('Failed to load tour:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-center bg-dark-900">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen pt-32 flex flex-col justify-center items-center bg-dark-900 text-white container-custom text-center">
        <h1 className="text-3xl font-display font-bold mb-4">No Active Tour Found</h1>
        <p className="text-dark-400 mb-8">We are currently preparing our next exciting tour package. Please check back soon!</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-b from-dark-900/80 via-dark-900/70 to-dark-900 z-10" />
          <img  
            src={tour.thumbnailUrl || '/images/tour-bg-placeholder.jpg'} 
            alt={tour.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container-custom relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 mb-6"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {tour.departures && tour.departures.length > 0 
                  ? getDepartureBadgeText(tour)
                  : tour.dates 
                  ? `${tour.dates.departure} - ${tour.dates.return}` 
                  : 'TBA'}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight"
            >
              {tour.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-dark-200 mb-8 max-w-2xl"
            >
              {tour.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
            <Link href={`/register?tourId=${tour.id}`} className="btn-gold">
                Book Now
              </Link>
              <Link href="#itinerary" className="btn-secondary">
                View Itinerary
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game / Event Info */}
      <section className="py-16 bg-dark-800 border-y border-dark-700">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-gold-500 font-bold tracking-wider text-sm uppercase">Main Event</span>
              <h2 className="text-3xl font-display font-bold text-white mt-2 mb-6">
                {tour.productCategory === 'courtside'
                  ? (tour.gameInfo.matchup || 'Main Event')
                  : (tour.title || 'Main Event')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-dark-700 text-gold-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Date & Time</h3>
                    <p className="text-dark-300">{tour.gameInfo.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-dark-700 text-gold-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {tour.productCategory === 'courtside' ? 'Venue' : 'Location'}
                    </h3>
                    <p className="text-dark-300">{tour.gameInfo.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-dark-700 text-gold-500">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {tour.productCategory === 'courtside' ? 'Matchup' : 'Event Info'}
                    </h3>
                    {tour.productCategory === 'courtside' && tour.gameInfo.matchup && (
                      <p className="text-dark-300">{tour.gameInfo.matchup}</p>
                    )}
                    <p className="text-dark-400 text-sm mt-1">{tour.gameInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden border border-dark-600 shadow-2xl">
                {tour.heroImageUrl ? (
                  <img
                    src={tour.heroImageUrl}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Placeholder for Game Image */
                  <div className="absolute inset-0 bg-linear-to-br from-blue-900 to-dark-900 flex items-center justify-center">
                    <span className="text-white/20 text-4xl font-display font-bold">KBL ALL-STAR</span>
                  </div>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-500/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Flight Information */}
      {tour.flightRoutes && tour.flightRoutes.length > 0 && (
        <section className="py-20 bg-dark-900">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="section-heading mb-4">Flight Information</h2>
              <p className="text-dark-400 max-w-2xl mx-auto">
                Comfortable flights with premium airlines. Choose your departure city.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {tour.flightRoutes.map((route, index) => (
                <div key={index} className="card-premium p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 bg-gold-500/10 rounded-bl-2xl">
                    <Plane className="w-6 h-6 text-gold-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-gold-500">{route.origin.split(' ')[0]}</span>
                    <span className="text-dark-500">to</span>
                    <span className="text-white">{route.destination.split(' ')[0]}</span>
                  </h3>

                  <div className="space-y-8">
                    {/* Outbound */}
                    <div className="relative pl-8 border-l border-dark-700">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-gold-500" />
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded">OUTBOUND</span>
                        <span className="text-dark-400 text-sm">{route.airline} • {route.outbound.flightNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-bold text-lg">{route.outbound.departureTime}</p>
                          <p className="text-dark-500 text-sm">{route.origin}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px bg-dark-700 relative">
                            <Plane className="w-4 h-4 text-dark-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{route.outbound.arrivalTime}</p>
                          <p className="text-dark-500 text-sm">{route.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inbound */}
                    <div className="relative pl-8 border-l border-dark-700">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-dark-500" />
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-dark-400 bg-dark-800 px-2 py-0.5 rounded">RETURN</span>
                        <span className="text-dark-400 text-sm">{route.airline} • {route.inbound.flightNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-bold text-lg">{route.inbound.departureTime}</p>
                          <p className="text-dark-500 text-sm">{route.destination}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px bg-dark-700 relative">
                            <Plane className="w-4 h-4 text-dark-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{route.inbound.arrivalTime}</p>
                          <p className="text-dark-500 text-sm">{route.origin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Itinerary */}
      <section id="itinerary" className="py-24 bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Tour Itinerary</h2>
            <p className="text-dark-400">An unforgettable journey packed with excitement.</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {tour.itinerary.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative pl-8 md:pl-0 ${day.highlight ? 'md:scale-105' : ''}`}
              >
                {/* Timeline Line (Desktop) */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-dark-800 -translate-x-1/2" />
                
                <div className={`md:flex items-center justify-between gap-12 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}>
                  {/* Date Circle (Desktop) */}
                  <div className="hidden md:flex absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full bg-dark-900 border-4 border-dark-800 items-center justify-center z-10">
                    <span className="text-gold-500 font-bold">{day.day}</span>
                  </div>

                  {/* Content */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} mb-8 md:mb-0`}>
                    <div className={`card p-6 md:p-8 hover:border-gold-500/30 transition-colors ${
                      day.highlight ? 'bg-linear-to-br from-gold-900/20 to-dark-800 border-gold-500/30' : ''
                    }`}>
                      <div className="flex items-center gap-3 mb-4 md:hidden">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gold-500 text-dark-900 font-bold text-sm">
                          {day.day}
                        </span>
                        <span className="text-gold-500 font-medium">{day.date}</span>
                      </div>
                      
                      <div className={`hidden md:block mb-2 text-gold-500 font-medium ${
                        index % 2 === 0 ? 'text-left' : 'text-right'
                      }`}>
                        {day.date}
                      </div>

                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 md:block">
                        {day.highlight && <span className="md:hidden">⭐</span>}
                        {day.title}
                        {day.highlight && <span className="hidden md:inline ml-2">⭐</span>}
                      </h3>
                      
                      <ul className={`space-y-2 text-dark-300 ${
                        index % 2 === 0 ? '' : 'md:flex md:flex-col md:items-end'
                      }`}>
                        {day.activities.map((activity, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gold-500 mt-1.5">•</span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>

                      <div className={`mt-6 pt-4 border-t border-dark-700 flex flex-wrap gap-3 ${
                        index % 2 === 0 ? 'justify-start' : 'md:justify-end'
                      }`}>
                        {day.meals.breakfast && (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-dark-700 text-dark-300">Breakfast</span>
                        )}
                        {day.meals.lunch && (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-dark-700 text-dark-300">Lunch</span>
                        )}
                        {day.meals.dinner && (
                          <span className="text-xs font-medium px-2 py-1 rounded bg-dark-700 text-dark-300">Dinner</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Empty Spacer for alternating layout */}
                  <div className="md:w-1/2" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing & CTA */}
      <section className="py-24 bg-premium-gradient relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-10" />
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto bg-dark-900/50 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
              Ready for the Ultimate Experience?
            </h2>
            <p className="text-lg text-dark-200 mb-10 max-w-2xl mx-auto">
              Don't miss this chance to support Filipino players in Korea and experience the thrill of the KBL All-Star Game.
            </p>

            {tour.pricingByOrigin && tour.pricingByOrigin.length > 0 ? (
              <div className="max-w-2xl mx-auto mb-10">
                <p className="text-dark-400 text-sm uppercase tracking-wider mb-4">Pricing by Departure City</p>
                <div className="space-y-4">
                  {(() => {
                    const originsFromRoutes = (tour.flightRoutes || []).map(r => r.origin).filter(Boolean);
                    const originsFromPricing = (tour.pricingByOrigin || []).map(p => p.origin).filter(Boolean);
                    const origins = Array.from(new Set([...originsFromRoutes, ...originsFromPricing]));

                    return origins.map((origin) => {
                      const p = tour.pricingByOrigin?.find(x => x.origin === origin);
                      const currency = (p?.currency || tour.pricing.currency);
                    return (
                      <div key={origin} className="bg-dark-800/80 p-6 rounded-xl border border-dark-600 text-left">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                          <div className="text-white font-bold text-lg">{origin}</div>
                          <div className="text-dark-400 text-xs">Adult / Child</div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Adult (12+)</p>
                            <div className="text-2xl font-bold text-white">
                              <span className="text-sm align-top text-gold-500 mr-1">{currency}</span>
                              {(p?.adult ?? tour.pricing.adult).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Child (&lt;12)</p>
                            <div className="text-2xl font-bold text-white">
                              <span className="text-sm align-top text-gold-500 mr-1">{currency}</span>
                              {(p?.child ?? tour.pricing.child).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto mb-10">
                <div className="bg-dark-800/80 p-6 rounded-xl border border-dark-600">
                  <p className="text-dark-400 text-sm uppercase tracking-wider mb-2">Adult (12+)</p>
                  <div className="text-3xl font-bold text-white">
                    <span className="text-sm align-top text-gold-500 mr-1">{tour.pricing.currency}</span>
                    {tour.pricing.adult.toLocaleString()}
                  </div>
                </div>
                <div className="bg-dark-800/80 p-6 rounded-xl border border-dark-600">
                  <p className="text-dark-400 text-sm uppercase tracking-wider mb-2">Child (&lt;12)</p>
                  <div className="text-3xl font-bold text-white">
                    <span className="text-sm align-top text-gold-500 mr-1">{tour.pricing.currency}</span>
                    {tour.pricing.child.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <Link href="/register" className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20">
              Book Your Spot Now
            </Link>
            <p className="mt-4 text-sm text-dark-400">Limited seats available. First come, first served.</p>
          </div>
        </div>
      </section>
    </>
  );
}
