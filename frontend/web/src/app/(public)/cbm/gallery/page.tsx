'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';
import { getGalleryImages } from '@/lib/services/gallery';
import type { GalleryImage } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

const categories = [
  { value: 'all', label: 'All Photos' },
  { value: 'tour', label: 'Tour Scenes' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'other', label: 'Other' },
];

export default function CherryBlossomGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const allImages = await getGalleryImages();
        // Filter for Cherry Blossom images (or all if no productId set)
        const cbmImages = allImages.filter((img) => !img.productId || img.productId === 'cherry-blossom');
        setImages(cbmImages);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredImages = activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory);

  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4" style={{ color: theme.headingText }}>
            Cherry Blossom Gallery
          </h1>
          <p className="text-lg" style={{ color: theme.mutedText }}>
            Explore photos from Cherry Blossom Marathon tours
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className="px-6 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: activeCategory === category.value ? theme.goldColor : theme.secondaryBtnBg,
                color: activeCategory === category.value ? theme.pageBg : theme.secondaryBtnText,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: activeCategory === category.value ? theme.goldColor : theme.secondaryBtnBorder,
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== category.value) e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.secondaryBtnBorder }}>
            <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <p className="text-lg" style={{ color: theme.mutedText }}>
              No photos found in this category.
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
              >
                <div className="relative group rounded-xl overflow-hidden" style={{ backgroundColor: theme.cardBg }}>
                  <img
                    src={image.url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: `${theme.pageBg}40` }} />
                  {image.caption && (
                    <div
                      className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(to top, ${theme.pageBg}, transparent)` }}
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


