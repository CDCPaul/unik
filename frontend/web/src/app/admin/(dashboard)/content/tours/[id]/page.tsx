'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Upload, Loader2, Calendar, MapPin, Plane, ArrowLeft } from 'lucide-react';
import { getTour, updateTour, createTour, uploadTourImage } from '@/lib/services/admin/tours';
import type { TourPackage, ItineraryDay, FlightRoute, TourDeparture } from '@unik/shared/types';
import Link from 'next/link';

const PRODUCT_OPTIONS: Array<{ 
  value: { category: TourPackage['productCategory'], type: TourPackage['tourType'] }, 
  label: string 
}> = [
  { value: { category: 'courtside', type: 'regular' }, label: 'Courtside - Regular Tours' },
  { value: { category: 'courtside', type: 'special-event' }, label: 'Courtside - Special Event' },
  { value: { category: 'cherry-blossom', type: 'special-event' }, label: 'Cherry Blossom Marathon' },
];

const defaultTour: Omit<TourPackage, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  subtitle: '',
  duration: '3 Nights 4 Days',
  productCategory: 'courtside',
  tourType: 'regular',
  departures: [],
  gameInfo: {
    date: '',
    venue: '',
    matchup: '',
    description: '',
  },
  flightRoutes: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  pricing: {
    adult: 0,
    child: 0,
    currency: 'PHP',
  },
  thumbnailUrl: '',
  galleryUrls: [],
  isActive: true,
  isFeatured: false,
  isFeaturedOnHome: false,
};

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;
  const isNew = tourId === 'new';

  const [tour, setTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isNew) {
      setTour(defaultTour as TourPackage);
    } else {
      loadTour();
    }
  }, [tourId]);

  const loadTour = async () => {
    setIsLoading(true);
    try {
      const data = await getTour(tourId);
      if (data) {
        // Ensure departures array exists for backward compatibility
        if (!data.departures) {
          data.departures = [];
        }
        setTour(data);
      } else {
        alert('Tour not found');
        router.push('/admin/content/tours');
      }
    } catch (error) {
      console.error('Error loading tour:', error);
      alert('Failed to load tour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tour) return;

    // Validation
    if (!tour.title.trim()) {
      alert('Please enter a tour title');
      return;
    }
    if (!tour.departures || tour.departures.length === 0) {
      alert('Please add at least one departure date');
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const newId = await createTour(tour);
        alert('Tour created successfully!');
        router.push(`/admin/content/tours/${newId}`);
      } else {
        await updateTour(tour);
        alert('Tour updated successfully!');
      }
    } catch (error) {
      alert('Failed to save tour');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadTourImage(file, tour.id || 'temp');
      if (type === 'thumbnail') {
        setTour({ ...tour, thumbnailUrl: imageUrl });
      } else {
        setTour({ ...tour, galleryUrls: [...tour.galleryUrls, imageUrl] });
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Departure management
  const addDeparture = () => {
    if (!tour) return;
    const newDeparture: TourDeparture = {
      id: `dep_${Date.now()}`,
      departureDate: '',
      returnDate: '',
      availableSeats: 0, // Not used in UI, but required by type
      status: 'available', // Not used in UI, but required by type
      specialNote: '',
    };
    setTour({ ...tour, departures: [...(tour.departures || []), newDeparture] });
  };

  const updateDeparture = (index: number, updates: Partial<TourDeparture>) => {
    if (!tour || !tour.departures) return;
    const newDepartures = [...tour.departures];
    newDepartures[index] = { ...newDepartures[index], ...updates };
    setTour({ ...tour, departures: newDepartures });
  };

  const deleteDeparture = (index: number) => {
    if (!tour || !tour.departures) return;
    setTour({ ...tour, departures: tour.departures.filter((_, i) => i !== index) });
  };

  // Itinerary management
  const addItineraryDay = () => {
    if (!tour) return;
    const newDay: ItineraryDay = {
      day: tour.itinerary.length + 1,
      date: '',
      title: 'New Day',
      activities: ['Activity 1'],
      meals: { breakfast: false, lunch: false, dinner: false },
      highlight: false,
    };
    setTour({ ...tour, itinerary: [...tour.itinerary, newDay] });
  };

  const updateItineraryDay = (index: number, updates: Partial<ItineraryDay>) => {
    if (!tour) return;
    const newItinerary = [...tour.itinerary];
    newItinerary[index] = { ...newItinerary[index], ...updates };
    setTour({ ...tour, itinerary: newItinerary });
  };

  const deleteItineraryDay = (index: number) => {
    if (!tour) return;
    const newItinerary = tour.itinerary.filter((_, i) => i !== index);
    setTour({ ...tour, itinerary: newItinerary });
  };

  const addActivity = (dayIndex: number) => {
    if (!tour) return;
    const newItinerary = [...tour.itinerary];
    newItinerary[dayIndex].activities.push('New activity');
    setTour({ ...tour, itinerary: newItinerary });
  };

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    if (!tour) return;
    const newItinerary = [...tour.itinerary];
    newItinerary[dayIndex].activities[activityIndex] = value;
    setTour({ ...tour, itinerary: newItinerary });
  };

  const deleteActivity = (dayIndex: number, activityIndex: number) => {
    if (!tour) return;
    const newItinerary = [...tour.itinerary];
    newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
    setTour({ ...tour, itinerary: newItinerary });
  };

  // Flight Route management
  const addFlightRoute = () => {
    if (!tour) return;
    const newRoute: FlightRoute = {
      id: `flight_${Date.now()}`,
      origin: 'Manila (MNL)',
      destination: 'Incheon (ICN)',
      airline: 'Korean Air',
      outbound: {
        flightNumber: '',
        departureTime: '',
        arrivalTime: '',
      },
      inbound: {
        flightNumber: '',
        departureTime: '',
        arrivalTime: '',
      },
    };
    setTour({ ...tour, flightRoutes: [...(tour.flightRoutes || []), newRoute] });
  };

  const updateFlightRoute = (index: number, updates: Partial<FlightRoute>) => {
    if (!tour) return;
    const newRoutes = [...(tour.flightRoutes || [])];
    newRoutes[index] = { ...newRoutes[index], ...updates };
    setTour({ ...tour, flightRoutes: newRoutes });
  };

  const deleteFlightRoute = (index: number) => {
    if (!tour) return;
    const newRoutes = (tour.flightRoutes || []).filter((_, i) => i !== index);
    setTour({ ...tour, flightRoutes: newRoutes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!tour) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/content/tours" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isNew ? 'Create New Tour' : 'Edit Tour'}
            </h1>
            <p className="text-slate-500 mt-1">
              {isNew ? 'Add a new tour package' : 'Update tour details'}
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="admin-btn-primary">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isNew ? 'Create Tour' : 'Save Changes'}
            </>
          )}
        </button>
      </div>

      {/* Basic Info */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Product Category & Type <span className="text-red-500">*</span>
            </label>
            <select
              value={JSON.stringify({ category: tour.productCategory, type: tour.tourType })}
              onChange={(e) => {
                const { category, type } = JSON.parse(e.target.value);
                setTour({ ...tour, productCategory: category, tourType: type });
              }}
              className="admin-input bg-white text-black"
            >
              {PRODUCT_OPTIONS.map(opt => (
                <option key={`${opt.value.category}-${opt.value.type}`} value={JSON.stringify(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Select the product category and whether this is a regular tour or special event.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tour.title}
              onChange={(e) => setTour({ ...tour, title: e.target.value })}
              className="admin-input bg-white text-black"
              placeholder="e.g., KBL All-Star 2026 Premium Tour"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subtitle</label>
            <input
              type="text"
              value={tour.subtitle}
              onChange={(e) => setTour({ ...tour, subtitle: e.target.value })}
              className="admin-input bg-white text-black"
              placeholder="e.g., Witness Filipino Pride at Seoul"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
            <input
              type="text"
              value={tour.duration}
              onChange={(e) => setTour({ ...tour, duration: e.target.value })}
              className="admin-input bg-white text-black"
              placeholder="e.g., 3 Nights 4 Days"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tour.isActive}
                onChange={(e) => setTour({ ...tour, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Active (Visible to customers)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tour.isFeatured}
                onChange={(e) => setTour({ ...tour, isFeatured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tour.isFeaturedOnHome || false}
                onChange={(e) => setTour({ ...tour, isFeaturedOnHome: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">⭐ Display on Home Page</span>
            </label>
          </div>
        </div>
      </div>

      {/* Hero Image for Home Page */}
      <div className="admin-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Hero Image (Home Page)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Upload a hero image that will be displayed on the home page when "Display on Home Page" is checked.
            Recommended: 16:9 aspect ratio (1920x1080px or higher).
          </p>
          
          <div className="flex items-start gap-4">
            {tour.heroImageUrl && (
              <div className="flex-shrink-0">
                <div className="w-64 h-36 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <img
                    src={tour.heroImageUrl}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors text-sm w-fit">
                <Upload className="w-4 h-4" />
                {tour.heroImageUrl ? 'Change Hero Image' : 'Upload Hero Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (!file.type.startsWith('image/')) {
                      alert('Please upload an image file');
                      return;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                      alert('Image size must be less than 5MB');
                      return;
                    }

                    try {
                      setUploadingImage(true);
                      const imageUrl = await uploadTourImage(file, tour.id || 'temp');
                      setTour({ ...tour, heroImageUrl: imageUrl });
                    } catch (error) {
                      alert('Failed to upload image');
                    } finally {
                      setUploadingImage(false);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
              {tour.heroImageUrl && (
                <button
                  type="button"
                  onClick={() => setTour({ ...tour, heroImageUrl: '' })}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove Hero Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Departure Dates */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Departure Dates
              <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Add multiple departure dates for the same tour package (e.g., monthly departures)
            </p>
          </div>
          <button onClick={addDeparture} className="admin-btn-secondary text-sm">
            <Plus className="w-4 h-4" />
            Add Date
          </button>
        </div>

        {!tour.departures || tour.departures.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500">No departure dates added yet. Click "Add Date" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tour.departures.map((departure, index) => (
              <div key={departure.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">Departure #{index + 1}</h3>
                  <button
                    onClick={() => deleteDeparture(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Departure Date</label>
                    <input
                      type="date"
                      value={departure.departureDate}
                      onChange={(e) => updateDeparture(index, { departureDate: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Return Date</label>
                    <input
                      type="date"
                      value={departure.returnDate}
                      onChange={(e) => updateDeparture(index, { returnDate: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Special Note (Optional)</label>
                    <input
                      type="text"
                      value={departure.specialNote || ''}
                      onChange={(e) => updateDeparture(index, { specialNote: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                      placeholder="e.g., Includes KBL All-Star Game"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Game Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Game Date</label>
            <input
              type="date"
              value={tour.gameInfo.date}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, date: e.target.value } })}
              className="admin-input bg-white text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue</label>
            <input
              type="text"
              value={tour.gameInfo.venue}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, venue: e.target.value } })}
              className="admin-input bg-white text-black"
              placeholder="e.g., Jamsil Indoor Gymnasium, Seoul"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Matchup</label>
            <input
              type="text"
              value={tour.gameInfo.matchup}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, matchup: e.target.value } })}
              className="admin-input bg-white text-black"
              placeholder="Filipino All-Stars vs Korean All-Stars"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={tour.gameInfo.description}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, description: e.target.value } })}
              className="admin-input bg-white text-black"
              rows={2}
              placeholder="Brief description of the game"
            />
          </div>
        </div>
      </div>

      {/* Flight Routes */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">Flight Information</h2>
          </div>
          <button onClick={addFlightRoute} className="admin-btn-secondary text-sm">
            <Plus className="w-4 h-4" />
            Add Route
          </button>
        </div>

        {tour.flightRoutes && tour.flightRoutes.length > 0 ? (
          <div className="space-y-4">
            {tour.flightRoutes.map((route, routeIndex) => (
              <div key={route.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">Route {routeIndex + 1}</h3>
                  <button
                    onClick={() => deleteFlightRoute(routeIndex)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Origin</label>
                    <input
                      type="text"
                      value={route.origin}
                      onChange={(e) => updateFlightRoute(routeIndex, { origin: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                      placeholder="Manila (MNL)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                    <input
                      type="text"
                      value={route.destination}
                      onChange={(e) => updateFlightRoute(routeIndex, { destination: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                      placeholder="Incheon (ICN)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Airline</label>
                    <input
                      type="text"
                      value={route.airline}
                      onChange={(e) => updateFlightRoute(routeIndex, { airline: e.target.value })}
                      className="admin-input text-sm bg-white text-black"
                      placeholder="Korean Air"
                    />
                  </div>
                </div>

                {/* Outbound Flight */}
                <div className="border-t border-slate-300 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">✈️ Outbound Flight</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Flight Number</label>
                      <input
                        type="text"
                        value={route.outbound.flightNumber}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          outbound: { ...route.outbound, flightNumber: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="KE621"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Departure Time</label>
                      <input
                        type="text"
                        value={route.outbound.departureTime}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          outbound: { ...route.outbound, departureTime: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="23:30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Arrival Time</label>
                      <input
                        type="text"
                        value={route.outbound.arrivalTime}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          outbound: { ...route.outbound, arrivalTime: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="05:00+1"
                      />
                    </div>
                  </div>
                </div>

                {/* Inbound Flight */}
                <div className="border-t border-slate-300 pt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">🔙 Return Flight</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Flight Number</label>
                      <input
                        type="text"
                        value={route.inbound.flightNumber}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          inbound: { ...route.inbound, flightNumber: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="KE620"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Departure Time</label>
                      <input
                        type="text"
                        value={route.inbound.departureTime}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          inbound: { ...route.inbound, departureTime: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="17:00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Arrival Time</label>
                      <input
                        type="text"
                        value={route.inbound.arrivalTime}
                        onChange={(e) => updateFlightRoute(routeIndex, {
                          inbound: { ...route.inbound, arrivalTime: e.target.value }
                        })}
                        className="admin-input text-sm bg-white text-black"
                        placeholder="21:00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Plane className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No flight routes added yet. Click &quot;Add Route&quot; to get started.</p>
          </div>
        )}
      </div>

      {/* Itinerary */}
      <div className="admin-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Daily Itinerary</h2>
          </div>
          <button onClick={addItineraryDay} className="admin-btn-secondary text-sm">
            <Plus className="w-4 h-4" />
            Add Day
          </button>
        </div>

        <div className="space-y-4">
          {tour.itinerary.map((day, dayIndex) => (
            <div key={dayIndex} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Day {day.day}</h3>
                <button
                  onClick={() => deleteItineraryDay(dayIndex)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={day.date}
                  onChange={(e) => updateItineraryDay(dayIndex, { date: e.target.value })}
                  placeholder="Jan 15"
                  className="admin-input text-sm bg-white text-black"
                />
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateItineraryDay(dayIndex, { title: e.target.value })}
                  placeholder="Day title"
                  className="admin-input text-sm bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Activities</label>
                <div className="space-y-2">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => updateActivity(dayIndex, actIndex, e.target.value)}
                        className="admin-input text-sm flex-1 bg-white text-black"
                      />
                      <button
                        onClick={() => deleteActivity(dayIndex, actIndex)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addActivity(dayIndex)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Activity
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={day.meals.breakfast || false}
                    onChange={(e) => updateItineraryDay(dayIndex, {
                      meals: { ...day.meals, breakfast: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Breakfast</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={day.meals.lunch || false}
                    onChange={(e) => updateItineraryDay(dayIndex, {
                      meals: { ...day.meals, lunch: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Lunch</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={day.meals.dinner || false}
                    onChange={(e) => updateItineraryDay(dayIndex, {
                      meals: { ...day.meals, dinner: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">Dinner</span>
                </label>
                <label className="flex items-center gap-2 ml-auto">
                  <input
                    type="checkbox"
                    checked={day.highlight || false}
                    onChange={(e) => updateItineraryDay(dayIndex, { highlight: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">⭐ Highlight Day</span>
                </label>
              </div>

              {/* Highlight Day Image Upload */}
              {day.highlight && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Highlight Day Image (for Main Event section)
                  </label>
                  <div className="flex items-start gap-4">
                    {day.imageUrl && (
                      <div className="flex-shrink-0">
                        <div className="w-32 h-20 border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                          <img
                            src={day.imageUrl}
                            alt={`Day ${day.day} preview`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        {day.imageUrl ? 'Change Image' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            if (!file.type.startsWith('image/')) {
                              alert('Please upload an image file');
                              return;
                            }
                            
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Image size must be less than 5MB');
                              return;
                            }

                            try {
                              const imageUrl = await uploadTourImage(file, tour.id || 'temp');
                              updateItineraryDay(dayIndex, { imageUrl });
                            } catch (error) {
                              alert('Failed to upload image');
                            } finally {
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {day.imageUrl && (
                        <button
                          type="button"
                          onClick={() => updateItineraryDay(dayIndex, { imageUrl: '' })}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Recommended: 16:9 aspect ratio (1920x1080px or higher). This image will be displayed in the Main Event section on the Overview page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adult Price</label>
            <input
              type="number"
              value={tour.pricing.adult}
              onChange={(e) => setTour({ ...tour, pricing: { ...tour.pricing, adult: parseFloat(e.target.value) } })}
              className="admin-input bg-white text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Child Price</label>
            <input
              type="number"
              value={tour.pricing.child}
              onChange={(e) => setTour({ ...tour, pricing: { ...tour.pricing, child: parseFloat(e.target.value) } })}
              className="admin-input bg-white text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
            <select
              value={tour.pricing.currency}
              onChange={(e) => setTour({ ...tour, pricing: { ...tour.pricing, currency: e.target.value as any } })}
              className="admin-input bg-white text-black"
            >
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
              <option value="KRW">KRW</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

