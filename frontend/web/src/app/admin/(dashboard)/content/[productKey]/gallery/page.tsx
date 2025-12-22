'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Loader2, Image as ImageIcon, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  addGalleryImage,
  deleteGalleryImage,
  deleteGalleryImageFile,
  getGalleryImages,
  updateGalleryImage,
  uploadGalleryImage,
} from '@/lib/services/admin/gallery';
import type { GalleryImage } from '@unik/shared/types';

type Category = 'game' | 'tour' | 'accommodation' | 'food' | 'other';
type ProductKey = 'courtside' | 'cherry-blossom';

const categories: { value: Category; label: string }[] = [
  { value: 'game', label: '🏀 Game' },
  { value: 'tour', label: '🗺️ Tour' },
  { value: 'accommodation', label: '🏨 Accommodation' },
  { value: 'food', label: '🍽️ Food' },
  { value: 'other', label: '📷 Other' },
];

function normalizeProductKey(key: string): ProductKey | null {
  if (key === 'courtside') return 'courtside';
  if (key === 'cherry-blossom') return 'cherry-blossom';
  return null;
}

function isImageInProduct(img: GalleryImage, productKey: ProductKey) {
  if (productKey === 'courtside') return !img.productId || img.productId === 'courtside';
  return img.productId === 'cherry-blossom';
}

export default function GalleryByProductPage() {
  const params = useParams();
  const productKey = normalizeProductKey(String(params.productKey || ''));

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [editingCaption, setEditingCaption] = useState<{ id: string; caption: string } | null>(null);

  const title = productKey === 'courtside' ? 'Courtside Gallery' : 'Cherry Blossom Gallery';

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await getGalleryImages();
      if (!productKey) {
        setImages([]);
      } else {
        setImages(data.filter((img) => isImageInProduct(img, productKey)));
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadImages();
  }, [productKey]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !productKey) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageUrl = await uploadGalleryImage(file);
        await addGalleryImage({
          url: imageUrl,
          caption: '',
          category: 'other',
          order: images.length + i,
          productId: productKey,
        });
      }
      await loadImages();
    } catch (error) {
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateCategory = async (id: string, category: Category) => {
    try {
      await updateGalleryImage(id, { category });
      setImages(images.map((img) => (img.id === id ? { ...img, category } : img)));
    } catch (error) {
      alert('Failed to update category');
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    try {
      await updateGalleryImage(id, { caption });
      setImages(images.map((img) => (img.id === id ? { ...img, caption } : img)));
      setEditingCaption(null);
    } catch (error) {
      alert('Failed to update caption');
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm('Delete this image?')) return;
    try {
      await deleteGalleryImage(image.id);
      await deleteGalleryImageFile(image.url);
      await loadImages();
    } catch (error) {
      alert('Failed to delete image');
    }
  };

  const filteredImages = useMemo(() => {
    return filterCategory === 'all' ? images : images.filter((img) => img.category === filterCategory);
  }, [filterCategory, images]);

  if (!productKey) {
    return (
      <div className="admin-card p-6">
        <div className="text-slate-900 font-semibold mb-1">Unknown product</div>
        <div className="text-slate-500 text-sm">Go back to Content and choose a valid product.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/admin/content/${productKey}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">Manage photos for this product</p>
        </div>
        <label className="admin-btn-primary cursor-pointer">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Images
            </>
          )}
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Filter */}
      <div className="admin-card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({images.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === cat.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({images.filter((img) => img.category === cat.value).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No images yet. Upload your first photo!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="admin-card overflow-hidden group"
            >
              <div className="aspect-square bg-slate-100 relative">
                <img src={image.url} alt={image.caption || ''} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(image)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2">
                <select
                  value={image.category}
                  onChange={(e) => handleUpdateCategory(image.id, e.target.value as Category)}
                  className="w-full text-xs px-2 py-1 border border-slate-300 rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                {editingCaption?.id === image.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editingCaption.caption}
                      onChange={(e) => setEditingCaption({ ...editingCaption, caption: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleUpdateCaption(image.id, editingCaption.caption);
                        if (e.key === 'Escape') setEditingCaption(null);
                      }}
                      className="admin-input text-xs flex-1"
                      placeholder="Caption..."
                      autoFocus
                    />
                    <button onClick={() => void handleUpdateCaption(image.id, editingCaption.caption)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
                      ✓
                    </button>
                  </div>
                ) : (
                  <p
                    onClick={() => setEditingCaption({ id: image.id, caption: image.caption || '' })}
                    className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 truncate"
                  >
                    {image.caption || 'Click to add caption'}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}








