'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, DollarSign, Edit, Trash2, Eye, EyeOff, Star, Loader2, ArrowLeft } from 'lucide-react';
import { getAllTours, deleteTour } from '@/lib/services/admin/tours';
import type { TourPackage } from '@unik/shared/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type ProductKey = 'courtside' | 'cherry-blossom';

function normalizeProductKey(key: string): ProductKey | null {
  if (key === 'courtside') return 'courtside';
  if (key === 'cherry-blossom') return 'cherry-blossom';
  return null;
}

function isTourInProduct(tour: TourPackage, productKey: ProductKey) {
  if (tour.productCategory === productKey) return true;
  if (productKey === 'courtside') return Boolean(tour.productId?.startsWith('courtside'));
  return Boolean(tour.productId?.includes('cherry'));
}

const PRODUCT_LABELS: Record<string, string> = {
  'courtside-regular': 'Courtside Regular',
  'courtside-special-event': 'Courtside Special',
  'cherry-blossom-special-event': 'Cherry Blossom',
};

const PRODUCT_COLORS: Record<string, string> = {
  'courtside-regular': 'bg-blue-100 text-blue-800 border-blue-200',
  'courtside-special-event': 'bg-purple-100 text-purple-800 border-purple-200',
  'cherry-blossom-special-event': 'bg-pink-100 text-pink-800 border-pink-200',
};

export default function ToursByProductPage() {
  const params = useParams();
  const productKey = normalizeProductKey(String(params.productKey || ''));

  const [tours, setTours] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const title = productKey === 'courtside' ? 'Courtside Tours' : 'Cherry Blossom Tours';

  const loadTours = async () => {
    setIsLoading(true);
    try {
      const data = await getAllTours();
      if (!productKey) {
        setTours([]);
      } else {
        setTours(data.filter((t) => isTourInProduct(t, productKey)));
      }
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTours();
  }, [productKey]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) return;
    try {
      await deleteTour(id);
      setTours(tours.filter((t) => t.id !== id));
      alert('Tour deleted successfully!');
    } catch (error) {
      alert('Failed to delete tour');
    }
  };

  const createHref = useMemo(() => {
    if (!productKey) return '/admin/content/tours/new';
    return `/admin/content/tours/new?productKey=${productKey}`;
  }, [productKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

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
          <p className="text-slate-500 mt-1">Manage tour packages and schedules for this product</p>
        </div>
        <Link href={createHref} className="admin-btn-primary">
          <Plus className="w-4 h-4" />
          Create New Tour
        </Link>
      </div>

      {/* Tours Grid */}
      {tours.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tours yet</h3>
          <p className="text-slate-500 mb-6">Create your first tour package to get started.</p>
          <Link href={createHref} className="admin-btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Create Tour Package
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tours.map((tour, index) => {
            const firstDeparture = tour.departures?.[0];
            const departureDate = firstDeparture?.departureDate || tour.dates?.departure || 'N/A';
            const departureCount = tour.departures?.length || 0;

            const productBadgeKey =
              tour.productCategory && tour.tourType ? `${tour.productCategory}-${tour.tourType}` : tour.productId || 'courtside-regular';

            return (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="admin-card overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                  {tour.thumbnailUrl ? (
                    <img
                      src={tour.thumbnailUrl}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-slate-300" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {tour.isFeatured && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-yellow-400 text-yellow-900 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                    {tour.isActive ? (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-green-500 text-white flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-slate-500 text-white flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${PRODUCT_COLORS[productBadgeKey] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      {PRODUCT_LABELS[productBadgeKey] || productBadgeKey}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{tour.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{tour.subtitle}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{departureDate}</span>
                      {departureCount > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          +{departureCount - 1} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">
                        {tour.pricing.currency} {tour.pricing.adult.toLocaleString()}
                      </span>
                      <span className="text-slate-400">/ adult</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <Link href={`/admin/content/tours/${tour.id}`} className="flex-1 admin-btn-secondary text-sm justify-center">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Tour"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}














