'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Utensils, RefreshCw } from 'lucide-react';
import { getTours } from '@/lib/services/tours';
import type { TourPackage } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

interface TourItineraryProps {
  productCategory: 'courtside' | 'cherry-blossom';
  tourType?: 'regular' | 'special-event';
}

export default function TourItinerary({ productCategory, tourType }: TourItineraryProps) {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

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

  if (!selectedTour || !selectedTour.itinerary || selectedTour.itinerary.length === 0) {
    return (
      <section className="pt-32 pb-16" style={{ backgroundColor: theme.pageBg, color: theme.bodyText }}>
        <div className="container-custom">
          <h2 className="section-heading mb-8" style={{ color: theme.headingText }}>Tour Itinerary</h2>
          <div className="text-center py-20 card" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
            <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.headingText }}>No Itinerary Available</h3>
            <p className="text-lg" style={{ color: theme.mutedText }}>
              The detailed itinerary for this tour is being prepared. Check back soon!
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
            {selectedTour.title} - Daily Itinerary
          </h2>
          <p className="text-lg" style={{ color: theme.bodyText }}>
            An unforgettable journey packed with excitement and cultural experiences
          </p>
        </div>

        {/* Tour Selector (if multiple tours) */}
        {tours.length > 1 && (
          <div className="mb-12 flex flex-wrap gap-3">
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

        {/* Itinerary Timeline */}
        <div className="max-w-5xl mx-auto space-y-8">
          {selectedTour.itinerary.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-8 md:pl-0 ${day.highlight ? 'md:scale-105' : ''}`}
            >
              {/* Timeline Line (Desktop) */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ backgroundColor: theme.cardBg }} />

              <div className={`md:flex items-center justify-between gap-12 ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}>
                {/* Date Circle (Desktop) */}
                <div className="hidden md:flex absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full border-4 items-center justify-center z-10"
                  style={{ backgroundColor: theme.pageBg, borderColor: day.highlight ? theme.goldColor : theme.cardBg }}
                >
                  <span className="font-bold" style={{ color: day.highlight ? theme.goldColor : theme.headingText }}>{day.day}</span>
                </div>

                {/* Content */}
                <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'} mb-8 md:mb-0`}>
                  <div 
                    className={`card p-6 md:p-8 transition-all duration-300 ${
                      day.highlight ? 'border-2' : ''
                    }`}
                    style={{
                      borderColor: day.highlight ? `${theme.goldColor}60` : theme.cardBg,
                      backgroundColor: day.highlight ? `${theme.goldColor}10` : theme.cardBg,
                    }}
                  >
                    {/* Mobile Date Badge */}
                    <div className="flex items-center gap-3 mb-4 md:hidden">
                      <span 
                        className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm" 
                        style={{ 
                          backgroundColor: day.highlight ? theme.goldColor : theme.secondaryBtnBg,
                          color: day.highlight ? theme.pageBg : theme.headingText
                        }}
                      >
                        {day.day}
                      </span>
                      <span className="font-medium" style={{ color: theme.goldColor }}>{day.date}</span>
                      {day.highlight && <span className="text-xl">⭐</span>}
                    </div>

                    {/* Desktop Date */}
                    <div className={`hidden md:block mb-2 font-medium ${
                      index % 2 === 0 ? 'text-left' : 'text-right'
                    }`} style={{ color: theme.goldColor }}>
                      {day.date}
                    </div>

                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 md:block" style={{ color: theme.headingText }}>
                      {day.title}
                      {day.highlight && <span className="hidden md:inline ml-2">⭐</span>}
                    </h3>

                    <ul className="space-y-2 mb-6" style={{ color: theme.bodyText }}>
                      {day.activities.map((activity, i) => (
                        <li key={i} className={`flex items-start gap-2 ${
                          index % 2 === 0 ? 'justify-start' : 'md:justify-end md:text-right'
                        }`}>
                          <span className="mt-1.5" style={{ color: theme.goldColor }}>•</span>
                          <span className="flex-1">{activity}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Meals */}
                    <div className={`pt-4 border-t flex flex-wrap gap-3 ${
                      index % 2 === 0 ? 'justify-start' : 'md:justify-end'
                    }`} style={{ borderColor: theme.secondaryBtnBorder }}>
                      {day.meals.breakfast && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1" 
                          style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}>
                          <Utensils className="w-3 h-3" />
                          Breakfast
                        </span>
                      )}
                      {day.meals.lunch && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1" 
                          style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}>
                          <Utensils className="w-3 h-3" />
                          Lunch
                        </span>
                      )}
                      {day.meals.dinner && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1" 
                          style={{ backgroundColor: theme.secondaryBtnBg, color: theme.bodyText }}>
                          <Utensils className="w-3 h-3" />
                          Dinner
                        </span>
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

        {/* Tour Duration Summary */}
        <div className="mt-16 text-center card p-8" style={{ backgroundColor: `${theme.goldColor}10`, borderColor: `${theme.goldColor}30` }}>
          <h3 className="text-2xl font-bold mb-4" style={{ color: theme.headingText }}>
            Complete {selectedTour.duration} Experience
          </h3>
          <p className="text-lg" style={{ color: theme.bodyText }}>
            Every moment carefully planned for your comfort and enjoyment
          </p>
        </div>
      </div>
    </section>
  );
}

