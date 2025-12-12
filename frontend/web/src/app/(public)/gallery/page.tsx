'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getGalleryImages } from '@/lib/services/gallery';
import type { GalleryImage, HomeProductKey, TourPackage } from '@unik/shared/types';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getTours } from '@/lib/services/tours';

function productKeyFromTour(tour: TourPackage | null): HomeProductKey {
  if (!tour) return 'default';
  if (tour.productCategory === 'courtside' || tour.productId?.startsWith('courtside')) return 'courtside';
  if (tour.productCategory === 'cherry-blossom' || tour.productId?.includes('cherry')) return 'cherry-blossom';
  return 'default';
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  const forcedProductKey: HomeProductKey | null = useMemo(() => {
    const v = (settings as any)?.homeFeaturedProductKey;
    if (!v || v === 'auto') return null;
    if (v === 'courtside' || v === 'cherry-blossom' || v === 'default') return v;
    return null;
  }, [settings]);

  const effectiveProductKey: HomeProductKey = forcedProductKey || productKeyFromTour(tour);

  useEffect(() => {
    async function loadData() {
      try {
        const [gallery, tours] = await Promise.all([getGalleryImages(), getTours()]);
        const activeTours = tours.filter((t) => t.isActive);
        const candidates = forcedProductKey
          ? activeTours.filter((t) => {
              if (forcedProductKey === 'default') return true;
              return t.productCategory === forcedProductKey || t.productId?.startsWith(forcedProductKey);
            })
          : activeTours;

        const homeTour =
          (candidates.length ? candidates : activeTours).find((t) => t.isFeaturedOnHome) ||
          (candidates.length ? candidates : activeTours).find((t) => t.isFeatured) ||
          (candidates.length ? candidates : activeTours)[0] ||
          tours[0] ||
          null;

        setTour(homeTour);
        setImages(gallery);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsLoading(true);
    loadData();
  }, [forcedProductKey]);

  const filteredImages = useMemo(() => {
    if (effectiveProductKey === 'default') return images;
    // Legacy: old images without productId were Courtside
    return images.filter((img) => img.productId === effectiveProductKey || (!img.productId && effectiveProductKey === 'courtside'));
  }, [images, effectiveProductKey]);

  return (
    <>
      <section className="pt-32 pb-12 bg-dark-900">
        <div className="container-custom text-center">
          <h1 className="section-heading mb-4">Gallery</h1>
          <p className="text-dark-400 max-w-2xl mx-auto mb-8">
            Explore moments from our tours and the excitement of KBL basketball.
          </p>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-gold-500" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20 bg-dark-800/50 rounded-2xl border border-dark-700">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-dark-600" />
              <p className="text-dark-400 text-lg">No photos found.</p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="break-inside-avoid"
                >
                  <div className="relative group rounded-xl overflow-hidden bg-dark-800">
                    <img
                      src={image.url}
                      alt={image.caption || 'Gallery Image'}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      {image.caption && (
                        <p className="text-white font-medium">{image.caption}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

