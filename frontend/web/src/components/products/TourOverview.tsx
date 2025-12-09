'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Plane, Clock, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getTours } from '@/lib/services/tours';
import type { TourPackage } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

interface TourOverviewProps {
  productCategory: 'courtside' | 'cherry-blossom';
}

export default function TourOverview({ productCategory }: TourOverviewProps) {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'regular' | 'special-event'>('special-event');
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const allTours = await getTours();
        // Filter by product category and active status
        const categoryTours = allTours.filter(
          t => (t.productCategory === productCategory || t.productId?.startsWith(productCategory)) && t.isActive
        );
        setTours(categoryTours);

        // Auto-select tab based on available tours
        const hasSpecial = categoryTours.some(t => t.tourType === 'special-event' || t.productId?.includes('special'));
        const hasRegular = categoryTours.some(t => t.tourType === 'regular' || (!t.productId?.includes('special') && t.productId?.includes(productCategory)));
        
        if (hasSpecial) {
          setActiveTab('special-event');
        } else if (hasRegular) {
          setActiveTab('regular');
        }
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productCategory]);

  // Get current tour based on active tab
  const currentTour = tours.find(t => {
    if (t.tourType) {
      return t.tourType === activeTab;
    }
    // Legacy support
    if (activeTab === 'special-event') {
      return t.productId?.includes('special');
    }
    return t.productId === productCategory;
  }) || tours[0];

  const hasRegular = tours.some(t => t.tourType === 'regular' || (!t.productId?.includes('special') && t.productId?.includes(productCategory)));
  const hasSpecial = tours.some(t => t.tourType === 'special-event' || t.productId?.includes('special'));

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex justify-center items-center" style={{ backgroundColor: theme.pageBg }}>
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  if (!currentTour) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center items-center container-custom text-center py-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
        <h1 className="text-3xl font-display font-bold mb-4" style={{ color: theme.headingText }}>No Tours Available</h1>
        <p className="mb-8" style={{ color: theme.mutedText }}>We are currently preparing tour packages. Please check back soon!</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Tour Type Tabs (if both types exist) */}
      {(hasRegular && hasSpecial) && (
        <div className="sticky top-20 z-40 py-4 border-b" style={{ backgroundColor: theme.pageBg, borderColor: theme.cardBg }}>
          <div className="container-custom flex gap-4">
            <button
              onClick={() => setActiveTab('regular')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300`}
              style={{
                color: activeTab === 'regular' ? theme.primaryBtnText : theme.mutedText,
                backgroundColor: activeTab === 'regular' ? theme.primaryBtnBg : theme.cardBg,
                border: `1px solid ${activeTab === 'regular' ? theme.primaryBtnBg : theme.cardBg}`,
              }}
            >
              Regular Tours
            </button>
            <button
              onClick={() => setActiveTab('special-event')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300`}
              style={{
                color: activeTab === 'special-event' ? theme.primaryBtnText : theme.mutedText,
                backgroundColor: activeTab === 'special-event' ? theme.primaryBtnBg : theme.cardBg,
                border: `1px solid ${activeTab === 'special-event' ? theme.primaryBtnBg : theme.cardBg}`,
              }}
            >
              ⭐ Special Events
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section className="pt-32 pb-12" style={{ backgroundColor: theme.pageBg }}>
        <div className="container-custom">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
              style={{
                backgroundColor: `${theme.goldColor}1a`,
                borderColor: `${theme.goldColor}33`,
                color: theme.goldColor,
              }}
            >
              {currentTour.tourType === 'special-event' && <span className="text-xs font-bold">⭐ SPECIAL EVENT</span>}
              {currentTour.departures && currentTour.departures.length > 0 ? (
                <span className="text-sm font-medium">
                  {currentTour.departures[0].departureDate} - {currentTour.departures[0].returnDate}
                  {currentTour.departures.length > 1 && <span className="ml-2">+{currentTour.departures.length - 1} more dates</span>}
                </span>
              ) : currentTour.dates ? (
                <span className="text-sm font-medium">{currentTour.dates.departure} - {currentTour.dates.return}</span>
              ) : (
                <span className="text-sm font-medium">Tour Dates TBA</span>
              )}
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight"
              style={{ color: theme.headingText }}
            >
              {currentTour.title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg mb-6 max-w-2xl"
              style={{ color: theme.bodyText }}
            >
              {currentTour.subtitle}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/register" className="btn-gold">
                Book Now
              </Link>
              <Link href="#itinerary" className="btn-secondary">
                View Itinerary
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Info */}
      <section className="py-16 border-y" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-bold tracking-wider text-sm uppercase" style={{ color: theme.goldColor }}>Main Event</span>
              <h2 className="text-3xl font-display font-bold mt-2 mb-6" style={{ color: theme.headingText }}>
                {currentTour.gameInfo.matchup}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>Date & Time</h3>
                    <p style={{ color: theme.bodyText }}>{currentTour.gameInfo.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>Venue</h3>
                    <p style={{ color: theme.bodyText }}>{currentTour.gameInfo.venue}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: theme.secondaryBtnBg, color: theme.goldColor }}>
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: theme.headingText }}>About</h3>
                    <p className="text-sm mt-1" style={{ color: theme.bodyText }}>{currentTour.gameInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: theme.secondaryBtnBorder }}>
                {(() => {
                  // Priority 1: Use heroImageUrl (uploaded in admin)
                  if (currentTour.heroImageUrl) {
                    return (
                      <img
                        src={currentTour.heroImageUrl}
                        alt={currentTour.title}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  
                  // Priority 2: Find highlight day with image
                  const highlightDay = currentTour.itinerary?.find(day => day.highlight && day.imageUrl);
                  
                  if (highlightDay?.imageUrl) {
                    return (
                      <img
                        src={highlightDay.imageUrl}
                        alt={highlightDay.title}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  
                  // Fallback to placeholder
                  return (
                    <div className="absolute inset-0 bg-linear-to-br from-blue-900 to-[var(--theme-page-bg)] flex items-center justify-center">
                      <span className="text-4xl font-display font-bold" style={{ color: `${theme.headingText}20` }}>
                        {productCategory === 'courtside' ? 'KBL' : 'MARATHON'}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: `${theme.goldColor}20` }} />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${theme.accentColor}20` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & CTA */}
      <section className="py-24 bg-premium-gradient relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-10" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-12 border text-center"
            style={{
              backgroundColor: `${theme.pageBg}80`,
              backdropFilter: 'blur(12px)',
              borderColor: `${theme.headingText}10`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6" style={{ color: theme.headingText }}>
              Ready for the Ultimate Experience?
            </h2>
            <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: theme.bodyText }}>
              {currentTour.subtitle}
            </p>

            <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto mb-10">
              <div className="p-6 rounded-xl border" style={{ backgroundColor: `${theme.cardBg}80`, borderColor: theme.secondaryBtnBorder }}>
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: theme.mutedText }}>Adult (12+)</p>
                <div className="text-3xl font-bold" style={{ color: theme.headingText }}>
                  <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currentTour.pricing.currency}</span>
                  {currentTour.pricing.adult.toLocaleString()}
                </div>
              </div>
              <div className="p-6 rounded-xl border" style={{ backgroundColor: `${theme.cardBg}80`, borderColor: theme.secondaryBtnBorder }}>
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: theme.mutedText }}>Child (&lt;12)</p>
                <div className="text-3xl font-bold" style={{ color: theme.headingText }}>
                  <span className="text-sm align-top mr-1" style={{ color: theme.goldColor }}>{currentTour.pricing.currency}</span>
                  {currentTour.pricing.child.toLocaleString()}
                </div>
              </div>
            </div>

            <Link href="/register" className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20">
              Book Your Spot Now
            </Link>
            <p className="mt-4 text-sm" style={{ color: theme.mutedText }}>Limited seats available. First come, first served.</p>
          </div>
        </div>
      </section>
    </>
  );
}

