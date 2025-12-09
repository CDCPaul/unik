'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, Mail, Phone, Calendar, FileText, Globe, 
  Users, MessageSquare, Send, CheckCircle, AlertCircle,
  Minus, Plus, MapPin
} from 'lucide-react';
import { createRegistration } from '@/lib/services/registrations';
import { getTours } from '@/lib/services/tours';
import type { TourPackage, TourDeparture } from '@unik/shared/types';

interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  specialRequests: string;
}

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  
  // Tour selection state
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
  const [isLoadingTours, setIsLoadingTours] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationForm>();

  useEffect(() => {
    async function loadTours() {
      try {
        const allTours = await getTours();
        const activeTours = allTours.filter(t => t.isActive);
        setTours(activeTours);
        
        // Auto-select first tour and first departure
        if (activeTours.length > 0) {
          setSelectedTourId(activeTours[0].id);
          if (activeTours[0].departures && activeTours[0].departures.length > 0) {
            setSelectedDepartureId(activeTours[0].departures[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoadingTours(false);
      }
    }
    loadTours();
  }, []);

  const selectedTour = tours.find(t => t.id === selectedTourId);
  const availableDepartures = selectedTour?.departures || [];
  const selectedDeparture = availableDepartures.find(d => d.id === selectedDepartureId);

  const onSubmit = async (data: RegistrationForm) => {
    if (!selectedTourId || !selectedDepartureId) {
      setError('Please select a tour and departure date.');
      return;
    }

    const selectedDeparture = availableDepartures.find(d => d.id === selectedDepartureId);
    if (!selectedDeparture) {
      setError('Selected departure not found.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createRegistration({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        passportName: data.passportName,
        nationality: data.nationality,
        adultsCount,
        childrenCount,
        tourId: selectedTourId,
        tourTitle: selectedTour?.title || '',
        departureId: selectedDepartureId,
        departureDate: `${selectedDeparture.departureDate} - ${selectedDeparture.returnDate}`,
        specialRequests: data.specialRequests || '',
      });
      
      setIsSuccess(true);
      reset();
      setAdultsCount(1);
      setChildrenCount(0);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustCount = (type: 'adults' | 'children', operation: 'add' | 'subtract') => {
    if (type === 'adults') {
      setAdultsCount(prev => {
        if (operation === 'add' && prev < 10) return prev + 1;
        if (operation === 'subtract' && prev > 1) return prev - 1; // Minimum 1 adult
        return prev;
      });
    } else {
      setChildrenCount(prev => {
        if (operation === 'add' && prev < 10) return prev + 1;
        if (operation === 'subtract' && prev > 0) return prev - 1;
        return prev;
      });
    }
  };

  if (isSuccess) {
    return (
      <section className="min-h-screen pt-32 pb-16 bg-dark-900 flex items-center">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-4">
              Registration Submitted!
            </h1>
            <p className="text-dark-400 mb-8">
              Thank you for your interest! We'll contact you within 24 hours via email to confirm your booking.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                window.location.href = '/';
              }}
              className="btn-primary"
            >
              Return to Home
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-32 pb-16 bg-dark-900">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-display font-bold text-white mb-4">
              Register for Tour
            </h1>
            <p className="text-dark-400 text-lg">
              Fill out the form below to secure your spot on the ultimate basketball experience.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Tour Selection */}
              <div className="space-y-6 pb-8 border-b border-dark-700">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold-500" />
                  Select Your Tour
                </h3>

                {/* Tour Package */}
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Tour Package <span className="text-red-500">*</span>
                  </label>
                  {isLoadingTours ? (
                    <div className="text-dark-400">Loading tours...</div>
                  ) : tours.length === 0 ? (
                    <div className="text-dark-400">No active tours available at the moment.</div>
                  ) : (
                    <select
                      value={selectedTourId}
                      onChange={(e) => {
                        setSelectedTourId(e.target.value);
                        // Reset departure selection
                        const newTour = tours.find(t => t.id === e.target.value);
                        if (newTour?.departures && newTour.departures.length > 0) {
                          setSelectedDepartureId(newTour.departures[0].id);
                        } else {
                          setSelectedDepartureId('');
                        }
                      }}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      required
                    >
                      {tours.map(tour => (
                        <option key={tour.id} value={tour.id}>
                          {tour.title} - {tour.duration}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedTour && (
                    <p className="text-sm text-dark-400 mt-2">{selectedTour.subtitle}</p>
                  )}
                </div>

                {/* Departure Date */}
                {selectedTour && availableDepartures.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Departure Date <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDepartureId}
                      onChange={(e) => setSelectedDepartureId(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      required
                    >
                      {availableDepartures.map(departure => (
                        <option key={departure.id} value={departure.id}>
                          {new Date(departure.departureDate).toLocaleDateString()} - {new Date(departure.returnDate).toLocaleDateString()}
                          {departure.status === 'limited' && ' (Limited Seats)'}
                          {departure.status === 'sold-out' && ' (Sold Out)'}
                          {departure.specialNote && ` - ${departure.specialNote}`}
                        </option>
                      ))}
                    </select>
                    {selectedDeparture && selectedDeparture.availableSeats && (
                      <p className="text-sm text-gold-500 mt-2">
                        {selectedDeparture.availableSeats} seats remaining
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-gold-500" />
                  Personal Information
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('fullName', { required: 'Full name is required' })}
                      type="text"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      placeholder="John Doe"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('phone', { required: 'Phone number is required' })}
                      type="tel"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      placeholder="+63 912 345 6789"
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
                      type="date"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                    />
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Passport Name */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Passport Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('passportName', { required: 'Passport name is required' })}
                      type="text"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      placeholder="As shown in passport"
                    />
                    {errors.passportName && (
                      <p className="text-red-400 text-sm mt-1">{errors.passportName.message}</p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('nationality', { required: 'Nationality is required' })}
                      type="text"
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      placeholder="Filipino"
                    />
                    {errors.nationality && (
                      <p className="text-red-400 text-sm mt-1">{errors.nationality.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Size */}
              <div className="space-y-6 pt-8 border-t border-dark-700">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold-500" />
                  Group Size
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Adults */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-3">
                      Adults (12 years and above)
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', 'subtract')}
                        className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold text-white w-12 text-center">{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', 'add')}
                        className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-3">
                      Children (under 12 years)
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => adjustCount('children', 'subtract')}
                        className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-2xl font-bold text-white w-12 text-center">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('children', 'add')}
                        className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 text-white hover:bg-dark-700 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                  <p className="text-white font-medium">
                    Total: <span className="text-gold-500">{adultsCount + childrenCount} person(s)</span>
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              <div className="pt-8 border-t border-dark-700">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-gold-500" />
                  Additional Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-2">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    {...register('specialRequests')}
                    rows={4}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors resize-none"
                    placeholder="Dietary restrictions, accessibility needs, etc."
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoadingTours || tours.length === 0}
                className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Registration
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
