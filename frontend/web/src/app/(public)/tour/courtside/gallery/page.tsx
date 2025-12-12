'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getGalleryImages } from '@/lib/services/gallery';
import type { GalleryImage } from '@unik/shared/types';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function CourtsideGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const allImages = await getGalleryImages();
        // Filter for Courtside images (legacy: no productId = courtside)
        const courtsideImages = allImages.filter((img) => img.productId === 'courtside' || !img.productId);
        setImages(courtsideImages);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4" style={{ color: theme.headingText }}>
            Courtside Gallery
          </h1>
          <p className="text-lg" style={{ color: theme.mutedText }}>
            Explore photos from previous Courtside tours
          </p>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
          </div>
        ) : images.length === 0 ? (
          <div 
            className="text-center py-20 rounded-2xl border"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.secondaryBtnBorder }}
          >
            <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <p className="text-lg" style={{ color: theme.mutedText }}>
              No photos found.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
              >
                <div 
                  className="relative group rounded-xl overflow-hidden"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <img
                    src={image.url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: `${theme.pageBg}40` }}
                  />
                  {image.caption && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(to top, ${theme.pageBg}, transparent)`
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: theme.headingText }}>
                        {image.caption}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}



