'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getGalleryImages } from '@/lib/services/gallery';
import type { GalleryImage } from '@unik/shared/types';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';

const categories = [
  { value: 'all', label: 'All Photos' },
  { value: 'game', label: 'Game Action' },
  { value: 'tour', label: 'Tour Scenes' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'food', label: 'Food & Dining' },
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getGalleryImages();
        setImages(data);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter(img => img.category === activeCategory);

  return (
    <>
      <section className="pt-32 pb-12 bg-dark-900">
        <div className="container-custom text-center">
          <h1 className="section-heading mb-4">Gallery</h1>
          <p className="text-dark-400 max-w-2xl mx-auto mb-8">
            Explore moments from our tours and the excitement of KBL basketball.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.value
                    ? 'bg-gold-500 text-dark-900 shadow-lg shadow-gold-500/20'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-gold-500" />
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20 bg-dark-800/50 rounded-2xl border border-dark-700">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-dark-600" />
              <p className="text-dark-400 text-lg">No photos found in this category.</p>
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
                      <span className="text-gold-500 text-xs font-bold uppercase tracking-wider mt-2">
                        {categories.find(c => c.value === image.category)?.label || image.category}
                      </span>
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

