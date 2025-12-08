'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getActiveTour } from '@/lib/services/tours';
import { getPlayers } from '@/lib/services/players';
import { getGalleryImages } from '@/lib/services/gallery';
import type { TourPackage, Player, GalleryImage } from '@unik/shared/types';

export default function HomePage() {
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tourData, playersData, galleryData] = await Promise.all([
          getActiveTour(),
          getPlayers(),
          getGalleryImages()
        ]);
        
        setTour(tourData);
        // Featured players: prioritize All-Stars, then take top 4
        const sortedPlayers = playersData.sort((a, b) => (b.isAllStar ? 1 : 0) - (a.isAllStar ? 1 : 0));
        setFeaturedPlayers(sortedPlayers.slice(0, 4));
        setGalleryImages(galleryData.slice(0, 6)); // Take first 6 images
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/80 to-transparent z-10" />
          <img 
            src={tour?.thumbnailUrl || '/images/hero-placeholder.jpg'} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container-custom relative z-20 pt-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 font-medium text-sm mb-6">
                Official Tour Package
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6">
                {tour ? tour.title : 'Experience KBL All-Star 2026'}
              </h1>
              <p className="text-xl text-dark-200 mb-8 max-w-2xl">
                {tour ? tour.subtitle : 'Join the ultimate basketball tour from Philippines to Korea. Watch the game, meet the stars, and explore Seoul.'}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/tour" className="btn-primary">
                  View Tour Details
                </Link>
                <Link href="/register" className="btn-secondary">
                  Book Now <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>

            {/* Quick Info */}
            {tour && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex flex-wrap gap-8 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Date</p>
                    <p className="text-white font-medium">{tour.dates.departure} - {tour.dates.return}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold-500/10 text-gold-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 uppercase tracking-wider">Venue</p>
                    <p className="text-white font-medium">{tour.gameInfo.venue}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Players */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="section-heading mb-2">Filipino Stars</h2>
              <p className="text-dark-400">Meet the pride of Philippines in KBL.</p>
            </div>
            <Link href="/players" className="hidden md:flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors">
              View All Players <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <Link href={`/players/${player.id}`}>
                  <div className="card overflow-hidden">
                    <div className="aspect-[3/4] relative overflow-hidden bg-dark-800">
                      {player.thumbnailUrl ? (
                        <img 
                          src={player.thumbnailUrl} 
                          alt={player.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Star className="w-12 h-12 text-dark-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-80" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-gold-500 text-xs font-bold uppercase mb-1">{player.position}</div>
                        <h3 className="text-white font-bold text-lg">{player.name}</h3>
                        <p className="text-dark-400 text-xs">{player.team}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/players" className="btn-secondary w-full justify-center">
              View All Players
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-24 bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Tour Gallery</h2>
            <p className="text-dark-400">Sneak peek of what awaits you in Korea.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl overflow-hidden relative group aspect-square ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
              >
                <img 
                  src={image.url} 
                  alt={image.caption || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">{image.caption}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/gallery" className="btn-secondary">
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-premium-gradient relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-10" />
        <div className="container-custom relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Don't Miss the Action!
          </h2>
          <p className="text-lg text-dark-200 mb-10 max-w-2xl mx-auto">
            Secure your spot now for the KBL All-Star 2026 Tour. Limited seats available for this exclusive experience.
          </p>
          <Link href="/register" className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20">
            Register Now
          </Link>
        </div>
      </section>
    </>
  );
}
