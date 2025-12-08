'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Upload, Loader2, Calendar, MapPin, Plane } from 'lucide-react';
import { getActiveTour, updateTour, createTour, uploadTourImage } from '@/lib/services/admin/tours';
import type { TourPackage, ItineraryDay, FlightRoute } from '@unik/shared/types';

const defaultTour: Omit<TourPackage, 'id' | 'createdAt' | 'updatedAt'> = {
  title: 'KBL All-Star 2026 Premium Tour',
  subtitle: 'Witness Filipino Pride at Seoul',
  duration: '3 Nights 4 Days',
  dates: {
    departure: '2026-01-15',
    return: '2026-01-18',
  },
  gameInfo: {
    date: '2026-01-17',
    venue: 'Jamsil Indoor Gymnasium, Seoul',
    matchup: 'Filipino All-Stars vs Korean All-Stars',
    description: '10 Filipino players vs 10 Korean players in an epic showdown!',
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
  isFeatured: true,
};

export default function ToursPage() {
  const [tour, setTour] = useState<TourPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadTour();
  }, []);

  const loadTour = async () => {
    setIsLoading(true);
    try {
      const data = await getActiveTour();
      setTour(data);
    } catch (error) {
      console.error('Error loading tour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tour) return;

    setIsSaving(true);
    try {
      if (tour.id) {
        await updateTour(tour);
      } else {
        const id = await createTour(tour);
        setTour({ ...tour, id });
      }
      alert('Tour package saved successfully!');
    } catch (error) {
      alert('Failed to save tour package');
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

  const addItineraryDay = () => {
    if (!tour) return;
    const newDay: ItineraryDay = {
      day: tour.itinerary.length + 1,
      date: `Jan ${14 + tour.itinerary.length + 1}`,
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

  // Flight Route management functions
  const addFlightRoute = () => {
    if (!tour) return;
    const newRoute: FlightRoute = {
      id: `flight_${Date.now()}`,
      origin: 'Manila (MNL)',
      destination: 'Incheon (ICN)',
      airline: 'Korean Air',
      outbound: {
        flightNumber: 'KE621',
        departureTime: '23:30',
        arrivalTime: '05:00+1',
      },
      inbound: {
        flightNumber: 'KE620',
        departureTime: '17:00',
        arrivalTime: '21:00',
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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tour Package</h1>
          <p className="text-slate-500 mt-1">No tour package found. Create one now!</p>
        </div>
        <button
          onClick={() => setTour(defaultTour as TourPackage)}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Create KBL All-Star 2026 Tour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tour Package</h1>
          <p className="text-slate-500 mt-1">KBL All-Star 2026 Tour Details</p>
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
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Basic Info */}
      <div className="admin-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              type="text"
              value={tour.title}
              onChange={(e) => setTour({ ...tour, title: e.target.value })}
              className="admin-input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subtitle</label>
            <input
              type="text"
              value={tour.subtitle}
              onChange={(e) => setTour({ ...tour, subtitle: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
            <input
              type="text"
              value={tour.duration}
              onChange={(e) => setTour({ ...tour, duration: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Departure Date</label>
            <input
              type="date"
              value={tour.dates.departure}
              onChange={(e) => setTour({ ...tour, dates: { ...tour.dates, departure: e.target.value } })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Return Date</label>
            <input
              type="date"
              value={tour.dates.return}
              onChange={(e) => setTour({ ...tour, dates: { ...tour.dates, return: e.target.value } })}
              className="admin-input"
            />
          </div>
        </div>
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
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Venue</label>
            <input
              type="text"
              value={tour.gameInfo.venue}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, venue: e.target.value } })}
              className="admin-input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Matchup</label>
            <input
              type="text"
              value={tour.gameInfo.matchup}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, matchup: e.target.value } })}
              className="admin-input"
              placeholder="Filipino All-Stars vs Korean All-Stars"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={tour.gameInfo.description}
              onChange={(e) => setTour({ ...tour, gameInfo: { ...tour.gameInfo, description: e.target.value } })}
              className="admin-input"
              rows={2}
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
                      className="admin-input text-sm"
                      placeholder="Manila (MNL)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                    <input
                      type="text"
                      value={route.destination}
                      onChange={(e) => updateFlightRoute(routeIndex, { destination: e.target.value })}
                      className="admin-input text-sm"
                      placeholder="Incheon (ICN)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Airline</label>
                    <input
                      type="text"
                      value={route.airline}
                      onChange={(e) => updateFlightRoute(routeIndex, { airline: e.target.value })}
                      className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                        className="admin-input text-sm"
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
                  className="admin-input text-sm"
                />
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateItineraryDay(dayIndex, { title: e.target.value })}
                  placeholder="Day title"
                  className="admin-input text-sm"
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
                        className="admin-input text-sm flex-1"
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
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Child Price</label>
            <input
              type="number"
              value={tour.pricing.child}
              onChange={(e) => setTour({ ...tour, pricing: { ...tour.pricing, child: parseFloat(e.target.value) } })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
            <select
              value={tour.pricing.currency}
              onChange={(e) => setTour({ ...tour, pricing: { ...tour.pricing, currency: e.target.value as any } })}
              className="admin-input"
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

