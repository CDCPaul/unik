'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Plane, Info, RefreshCw } from 'lucide-react';
import { getTours } from '@/lib/services/tours';
import type { TourPackage, TourDeparture } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

interface TourScheduleProps {
  productCategory: 'courtside' | 'cherry-blossom';
  tourType?: 'regular' | 'special-event'; // Optional: show specific type
}

export default function TourSchedule({ productCategory, tourType }: TourScheduleProps) {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const flightOrigins = (() => {
    const routes = selectedTour?.flightRoutes || [];
    const origins = routes.map(r => r.origin).filter(Boolean);
    return Array.from(new Set(origins));
  })();

  const getDatesForOrigin = (dep: TourDeparture, origin: string) => {
    const match = dep.datesByOrigin?.find(d => d.origin === origin);
    return {
      departureDate: match?.departureDate || dep.departureDate,
      returnDate: match?.returnDate || dep.returnDate,
    };
  };

  useEffect(() => {
    async function loadData() {
      try {
        const allTours = await getTours();
        const filteredTours = allTours.filter(t => {
          const matchesCategory = t.productCategory === productCategory || t.productId?.startsWith(productCategory);
          const matchesType = !tourType || t.tourType === tourType || (tourType === 'special-event' && t.productId?.includes('special'));
          return matchesCategory && matchesType && t.isActive;
        });
        setTours(filteredTours);
        setSelectedTour(filteredTours[0] || null);
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productCategory, tourType]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex justify-center items-center" style={{ backgroundColor: theme.pageBg }}>
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  if (!selectedTour || !selectedTour.departures || selectedTour.departures.length === 0) {
    return (
      <section className="pt-32 pb-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
        <div className="container-custom">
          <h2 className="section-heading mb-8" style={{ color: theme.headingText }}>Tour Schedule</h2>
          <div className="text-center py-20 card" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.headingText }}>No Upcoming Tours</h3>
            <p className="text-lg" style={{ color: theme.mutedText }}>
              We're currently planning our next {productCategory === 'courtside' ? 'Courtside' : 'Cherry Blossom'} tours. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="pt-32 pb-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
      <div className="container-custom">
        <div className="mb-12">
          <h2 className="section-heading mb-4" style={{ color: theme.headingText }}>
            {selectedTour.title} - Schedule
          </h2>
          <p className="text-lg" style={{ color: theme.bodyText }}>
            Choose your departure date and join us for an unforgettable basketball experience
          </p>
        </div>

        {/* Tour Selector (if multiple tours) */}
        {tours.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-3">
            {tours.map(tour => (
              <button
                key={tour.id}
                onClick={() => setSelectedTour(tour)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                style={{
                  backgroundColor: selectedTour.id === tour.id ? theme.primaryBtnBg : theme.cardBg,
                  color: selectedTour.id === tour.id ? theme.primaryBtnText : theme.bodyText,
                  border: `1px solid ${selectedTour.id === tour.id ? theme.primaryBtnBg : theme.cardBg}`,
                }}
              >
                {tour.title}
              </button>
            ))}
          </div>
        )}

        {/* Departure Dates */}
        <div className="space-y-6 mb-16">
          <h3 className="text-2xl font-bold mb-6" style={{ color: theme.headingText }}>Available Departure Dates</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {selectedTour.departures
              .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())
              .map((departure, index) => (
                <motion.div
                  key={departure.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-6 relative overflow-hidden"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}
                >
                  <div className="space-y-4">
                    {/* Dates */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5" style={{ color: theme.goldColor }} />
                        <span className="text-sm font-medium" style={{ color: theme.mutedText }}>Departure & Return</span>
                      </div>
                      {flightOrigins.length > 1 && departure.datesByOrigin && departure.datesByOrigin.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-wider" style={{ color: theme.mutedText }}>
                            Dates vary by departure city
                          </div>
                          <div className="space-y-1">
                            {flightOrigins.map((origin) => {
                              const d = getDatesForOrigin(departure, origin);
                              return (
                                <div key={origin} className="flex flex-wrap items-baseline justify-between gap-2">
                                  <span className="text-sm font-semibold" style={{ color: theme.headingText }}>
                                    {origin}
                                  </span>
                                  <span className="text-sm" style={{ color: theme.bodyText }}>
                                    {new Date(d.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {' - '}
                                    {new Date(d.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xl font-bold" style={{ color: theme.headingText }}>
                          {new Date(departure.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' - '}
                          {new Date(departure.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: theme.goldColor }} />
                      <span style={{ color: theme.bodyText }}>{selectedTour.duration}</span>
                    </div>

                    {/* Special Note */}
                    {departure.specialNote && (
                      <div className="pt-3 border-t" style={{ borderColor: theme.secondaryBtnBorder }}>
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5" style={{ color: theme.goldColor }} />
                          <p className="text-sm" style={{ color: theme.bodyText }}>{departure.specialNote}</p>
                        </div>
                      </div>
                    )}

                    {/* Book Button */}
                    <button 
                      className="w-full mt-4 btn-primary"
                      disabled={departure.status === 'sold-out'}
                      style={{
                        opacity: departure.status === 'sold-out' ? 0.5 : 1,
                        cursor: departure.status === 'sold-out' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {departure.status === 'sold-out' ? 'Sold Out' : 'Book This Date'}
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* Flight Information */}
        {selectedTour.flightRoutes && selectedTour.flightRoutes.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold mb-6" style={{ color: theme.headingText }}>Flight Information</h3>
            <p className="mb-8" style={{ color: theme.mutedText }}>
              Comfortable flights with premium airlines. Choose your departure city.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {selectedTour.flightRoutes.map((route, index) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="card p-8 relative overflow-hidden group"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}
                >
                  <div className="absolute top-0 right-0 p-4 rounded-bl-2xl" style={{ backgroundColor: `${theme.goldColor}10` }}>
                    <Plane className="w-6 h-6" style={{ color: theme.goldColor }} />
                  </div>

                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: theme.headingText }}>
                    <span style={{ color: theme.goldColor }}>{route.origin.split(' ')[0]}</span>
                    <span style={{ color: theme.mutedText }}>to</span>
                    <span style={{ color: theme.headingText }}>{route.destination.split(' ')[0]}</span>
                  </h3>

                  <div className="space-y-8">
                    {/* Outbound */}
                    <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.goldColor }} />
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${theme.goldColor}10`, color: theme.goldColor }}>OUTBOUND</span>
                        <span className="text-sm" style={{ color: theme.mutedText }}>{route.airline} • {route.outbound.flightNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>{route.outbound.departureTime}</p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>{route.origin}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                            <Plane className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" style={{ color: theme.mutedText }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>{route.outbound.arrivalTime}</p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>{route.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inbound */}
                    <div className="relative pl-8 border-l" style={{ borderColor: theme.secondaryBtnBorder }}>
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full" style={{ backgroundColor: theme.mutedText }} />
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.mutedText }}>RETURN</span>
                        <span className="text-sm" style={{ color: theme.mutedText }}>{route.airline} • {route.inbound.flightNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>{route.inbound.departureTime}</p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>{route.destination}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                          <div className="w-full h-px relative" style={{ backgroundColor: theme.secondaryBtnBorder }}>
                            <Plane className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" style={{ color: theme.mutedText }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: theme.headingText }}>{route.inbound.arrivalTime}</p>
                          <p className="text-sm" style={{ color: theme.mutedText }}>{route.origin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* How to Choose Section */}
        <div className="mt-16 card p-8" style={{ backgroundColor: `${theme.goldColor}10`, borderColor: `${theme.goldColor}30` }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.headingText }}>
            <Info className="w-5 h-5" style={{ color: theme.goldColor }} />
            How to Choose Your Date
          </h3>
          <ul className="space-y-2" style={{ color: theme.bodyText }}>
            <li>• Featured tours include special events like All-Star games</li>
            <li>• Regular tours depart monthly with consistent schedules</li>
            <li>• All tours include game tickets, accommodation, and guided tours</li>
            <li>• Book early to secure your preferred date</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

