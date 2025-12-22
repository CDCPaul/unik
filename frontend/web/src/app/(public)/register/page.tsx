'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { 
  User, Mail, Phone, Calendar, FileText, Globe, 
  Users, MessageSquare, Send, CheckCircle, AlertCircle,
  Minus, Plus, MapPin
} from 'lucide-react';
import { createRegistration, type CreateRegistrationInput } from '@/lib/services/registrations';
import { getTours } from '@/lib/services/tours';
import { getPlayers } from '@/lib/services/players';
import type { Player, TourPackage, TourDeparture } from '@unik/shared/types';
import { useUiText } from '@/context/UiTextContext';
import { COUNTRIES } from '@/lib/data/countries';
import { DIAL_CODES } from '@/lib/data/dialCodes';
import { logEvent } from 'firebase/analytics';
import { initAnalytics } from '@/lib/firebase';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  fullName: string; // computed (hidden)
  email: string;
  phone: string; // computed (hidden)
  phoneLocalNumber: string;
  dateOfBirth: string;
  gender: 'female' | 'male';
  nationality: string;
  specialRequests: string;
}

function RegisterPageInner() {
  const searchParams = useSearchParams();
  const { t, font } = useUiText();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  
  // Tour selection state
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
  const [selectedDepartureOrigin, setSelectedDepartureOrigin] = useState<string>('');
  const [isLoadingTours, setIsLoadingTours] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobDay, setDobDay] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('+63');
  const [nationalityCountry, setNationalityCountry] = useState<{ code: string; name: string }>(() => {
    const ph = COUNTRIES.find(c => c.code === 'PH');
    return ph ? { code: ph.code, name: ph.name } : { code: 'PH', name: 'Philippines' };
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegistrationForm>();

  useEffect(() => {
    async function loadTours() {
      try {
        const allTours = await getTours();
        const activeTours = allTours.filter(t => t.isActive);
        setTours(activeTours);

        // Preselect tour/departure via query params (fallback to first active tour)
        if (activeTours.length > 0) {
          const tourIdParam = searchParams.get('tourId');
          const productParam = searchParams.get('product'); // 'courtside' | 'cherry-blossom'
          const departureIdParam = searchParams.get('departureId');
          const originParam =
            searchParams.get('origin') ||
            searchParams.get('departureOrigin') ||
            searchParams.get('pricingOrigin');

          const findByProduct = (product: string | null) => {
            if (!product) return null;
            const normalized = product.toLowerCase();
            return (
              activeTours.find(t => t.productCategory === normalized) ||
              activeTours.find(t => t.productId?.startsWith(normalized)) ||
              (normalized.includes('cherry')
                ? activeTours.find(t => t.productId?.includes('cherry') || t.productCategory?.includes('cherry'))
                : null)
            );
          };

          const initialTour =
            (tourIdParam ? activeTours.find(t => t.id === tourIdParam) : null) ||
            findByProduct(productParam) ||
            // Default to basketball product first
            activeTours.find(t => t.productCategory === 'courtside' || t.productId?.startsWith('courtside')) ||
            activeTours[0];

          setSelectedTourId(initialTour.id);

          // Preselect departure city/origin if provided
          if (originParam) {
            const origins = Array.from(new Set((initialTour.flightRoutes || []).map(r => r.origin).filter(Boolean)));
            if (origins.includes(originParam)) {
              setSelectedDepartureOrigin(originParam);
            }
          }

          const departures = initialTour.departures || [];
          if (departures.length > 0) {
            const initialDeparture =
              (departureIdParam ? departures.find(d => d.id === departureIdParam) : null) || departures[0];
            setSelectedDepartureId(initialDeparture.id);
          } else {
            setSelectedDepartureId('');
          }
        }
      } catch (error) {
        console.error('Failed to load tours:', error);
      } finally {
        setIsLoadingTours(false);
      }
    }
    loadTours();
  }, [searchParams]);

  const selectedTour = tours.find(t => t.id === selectedTourId);
  const availableDepartures = selectedTour?.departures || [];
  const selectedDeparture = availableDepartures.find(d => d.id === selectedDepartureId);

  const departureOrigins = (() => {
    const routes = selectedTour?.flightRoutes || [];
    const origins = routes.map(r => r.origin).filter(Boolean);
    return Array.from(new Set(origins));
  })();

  const selectedTravelDates = (() => {
    if (!selectedDeparture) return null;
    if (selectedDepartureOrigin) {
      const m = selectedDeparture.datesByOrigin?.find(d => d.origin === selectedDepartureOrigin);
      if (m) return { departureDate: m.departureDate, returnDate: m.returnDate, origin: selectedDepartureOrigin };
    }
    return { departureDate: selectedDeparture.departureDate, returnDate: selectedDeparture.returnDate, origin: selectedDepartureOrigin || undefined };
  })();

  const selectedPricing = (() => {
    if (!selectedTour) return null;
    const byOrigin = selectedTour.pricingByOrigin || [];
    const fallback = {
      origin: selectedDepartureOrigin || undefined,
      adult: selectedTour.pricing.adult,
      child: selectedTour.pricing.child,
      currency: selectedTour.pricing.currency,
    };

    // If we have origin-based pricing, prefer a matching origin.
    if (byOrigin.length > 0) {
      const originToUse =
        selectedDepartureOrigin ||
        (departureOrigins.length === 1 ? departureOrigins[0] : '') ||
        (byOrigin.length === 1 ? byOrigin[0].origin : '');

      if (!originToUse) {
        return { ...fallback, requiresOriginSelection: true as const };
      }

      const match = byOrigin.find(p => p.origin === originToUse);
      if (match) {
        return {
          origin: match.origin,
          adult: match.adult,
          child: match.child,
          currency: match.currency || selectedTour.pricing.currency,
          requiresOriginSelection: false as const,
        };
      }
    }

    return { ...fallback, requiresOriginSelection: false as const };
  })();

  const totalPrice = selectedPricing
    ? adultsCount * selectedPricing.adult + childrenCount * selectedPricing.child
    : 0;

  const availablePlayersForTour = (() => {
    const key = selectedTour?.productCategory;
    if (!key) return [];
    if (key === 'courtside') {
      return players
        .filter(p => !p.productIds?.length || p.productIds.includes('courtside'))
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [];
  })();

  useEffect(() => {
    async function loadPlayers() {
      try {
        const data = await getPlayers();
        setPlayers(data);
      } catch (e) {
        console.error('Failed to load players:', e);
      }
    }
    loadPlayers();
  }, []);

  // Keep Departure Origin in sync with selected tour
  useEffect(() => {
    if (!selectedTour) return;
    if (departureOrigins.length === 1) {
      setSelectedDepartureOrigin(departureOrigins[0]);
    } else if (departureOrigins.length === 0) {
      setSelectedDepartureOrigin('');
    } else if (selectedDepartureOrigin && !departureOrigins.includes(selectedDepartureOrigin)) {
      setSelectedDepartureOrigin('');
    }
    setFavoritePlayerIds([]);
  }, [selectedTourId]);

  // DOB dropdowns -> set hidden ISO date for form submission
  useEffect(() => {
    if (!dobYear || !dobMonth || !dobDay) {
      setValue('dateOfBirth', '');
      return;
    }
    const mm = String(dobMonth).padStart(2, '0');
    const dd = String(dobDay).padStart(2, '0');
    setValue('dateOfBirth', `${dobYear}-${mm}-${dd}`, { shouldValidate: true });
  }, [dobYear, dobMonth, dobDay, setValue]);

  // Name + Phone + Nationality computed fields
  useEffect(() => {
    // Keep form values aligned with our controlled dropdowns/inputs.
    setValue('nationality', nationalityCountry.name);
  }, [nationalityCountry, setValue]);

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

    if (selectedTour?.productCategory === 'courtside' && departureOrigins.length > 1 && !selectedDepartureOrigin) {
      setError('Please select a departure city.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const favoritePlayers = availablePlayersForTour.filter(p => favoritePlayerIds.includes(p.id));
      const payload: CreateRegistrationInput = {
        fullName: data.fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        phoneCountryCode,
        phoneLocalNumber: data.phoneLocalNumber,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        nationalityCountryCode: nationalityCountry.code,
        adultsCount,
        childrenCount,
        pricingOrigin: selectedPricing?.origin || selectedDepartureOrigin || undefined,
        unitPriceAdult: selectedPricing?.adult ?? selectedTour?.pricing.adult ?? 0,
        unitPriceChild: selectedPricing?.child ?? selectedTour?.pricing.child ?? 0,
        priceCurrency: (selectedPricing?.currency ?? selectedTour?.pricing.currency ?? 'PHP') as any,
        totalPrice,
        tourId: selectedTourId,
        tourTitle: selectedTour?.title || '',
        departureId: selectedDepartureId,
        departureDate: selectedTravelDates
          ? `${selectedTravelDates.departureDate} - ${selectedTravelDates.returnDate}`
          : `${selectedDeparture.departureDate} - ${selectedDeparture.returnDate}`,
        departureOrigin: selectedDepartureOrigin || undefined,
        favoritePlayerIds: favoritePlayerIds.length ? favoritePlayerIds : undefined,
        favoritePlayerNames: favoritePlayers.length ? favoritePlayers.map(p => `#${p.number} ${p.name}`) : undefined,
        specialRequests: data.specialRequests || '',
      };
      await createRegistration(payload);

      // Analytics (no PII)
      void (async () => {
        const analytics = await initAnalytics();
        if (!analytics) return;
        logEvent(analytics, 'registration_submitted', {
          tour_id: selectedTourId,
          departure_id: selectedDepartureId,
          origin: selectedDepartureOrigin || selectedPricing?.origin || '',
          adults: adultsCount,
          children: childrenCount,
        });
      })();
      
      setIsSuccess(true);
      reset();
      setAdultsCount(1);
      setChildrenCount(0);
      setSelectedDepartureOrigin('');
      setFavoritePlayerIds([]);
      setDobMonth('');
      setDobDay('');
      setDobYear('');
      setPhoneCountryCode('+63');
      const ph = COUNTRIES.find(c => c.code === 'PH');
      setNationalityCountry(ph ? { code: ph.code, name: ph.name } : { code: 'PH', name: 'Philippines' });
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
            <h1 className="text-4xl font-display font-bold text-white mb-4" style={{ fontFamily: font('register.title') }}>
              {t('register.title', 'Register for Tour')}
            </h1>
            <p className="text-dark-400 text-lg" style={{ fontFamily: font('register.subtitle') }}>
              {t('register.subtitle', 'Fill out the form below to secure your spot on the ultimate basketball experience.')}
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
                          {(() => {
                            const origin = selectedDepartureOrigin;
                            const m = origin ? departure.datesByOrigin?.find(d => d.origin === origin) : undefined;
                            const dep = m?.departureDate || departure.departureDate;
                            const ret = m?.returnDate || departure.returnDate;
                            const baseText = `${new Date(dep).toLocaleDateString()} - ${new Date(ret).toLocaleDateString()}`;
                            const varies = !origin && (departure.datesByOrigin?.length || 0) > 0;
                            return varies ? `${baseText} (dates vary by city)` : baseText;
                          })()}
                          {departure.specialNote && ` - ${departure.specialNote}`}
                        </option>
                      ))}
                    </select>
                    {selectedTravelDates && selectedDepartureOrigin && selectedDeparture?.datesByOrigin?.length ? (
                      <p className="text-xs text-dark-400 mt-2">
                        Selected city schedule: {selectedDepartureOrigin} → {selectedTravelDates.departureDate} - {selectedTravelDates.returnDate}
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Departure City (Courtside only, when multiple origins exist) */}
                {selectedTour?.productCategory === 'courtside' && departureOrigins.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Departure City {departureOrigins.length > 1 && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={selectedDepartureOrigin}
                      onChange={(e) => setSelectedDepartureOrigin(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      required={departureOrigins.length > 1}
                    >
                      {departureOrigins.length > 1 && <option value="">Select a city</option>}
                      {departureOrigins.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-dark-400 mt-2">This helps us prepare your flight options (e.g., Manila or Cebu).</p>
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
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Name <span className="text-red-500">*</span> <span className="text-dark-500">(Passport Name)</span>
                    </label>
                    <input type="hidden" {...register('fullName', { required: 'Name is required' })} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          {...register('firstName', { required: 'First name is required' })}
                          type="text"
                          className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                          placeholder="First name"
                          onChange={(e) => {
                            const v = e.target.value;
                            setValue('firstName', v, { shouldValidate: true });
                            // fullName = "Last, First"
                            const ln = (document.querySelector('input[name=\"lastName\"]') as HTMLInputElement | null)?.value || '';
                            const full = `${ln}`.trim()
                              ? `${ln.trim()}, ${v.trim()}`
                              : v.trim();
                            setValue('fullName', full, { shouldValidate: true });
                          }}
                        />
                        {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <input
                          {...register('lastName', { required: 'Last name is required' })}
                          type="text"
                          className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                          placeholder="Last name"
                          onChange={(e) => {
                            const v = e.target.value;
                            setValue('lastName', v, { shouldValidate: true });
                            const fn = (document.querySelector('input[name=\"firstName\"]') as HTMLInputElement | null)?.value || '';
                            const full = `${v}`.trim()
                              ? `${v.trim()}, ${fn.trim()}`
                              : fn.trim();
                            setValue('fullName', full, { shouldValidate: true });
                          }}
                        />
                        {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>}
                      </div>
                    </div>
                    <p className="text-xs text-dark-400 mt-2">Please enter first and last name only (no middle name).</p>
                    {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>}
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
                    <input type="hidden" {...register('phone', { required: 'Phone number is required' })} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={phoneCountryCode}
                        onChange={(e) => {
                          const code = e.target.value;
                          setPhoneCountryCode(code);
                          const local = (document.querySelector('input[name=\"phoneLocalNumber\"]') as HTMLInputElement | null)?.value || '';
                          setValue('phone', `${code} ${local}`.trim(), { shouldValidate: true });
                        }}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors sm:col-span-1"
                      >
                        {DIAL_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        {...register('phoneLocalNumber', { required: 'Local number is required' })}
                        type="tel"
                        inputMode="tel"
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors sm:col-span-2"
                        placeholder="9123456789"
                        onChange={(e) => {
                          const local = e.target.value.replace(/[^\d]/g, '');
                          // keep only digits in UI value
                          if (e.target.value !== local) e.target.value = local;
                          setValue('phoneLocalNumber', local, { shouldValidate: true });
                          setValue('phone', `${phoneCountryCode} ${local}`.trim(), { shouldValidate: true });
                        }}
                      />
                    </div>
                    <p className="text-xs text-dark-400 mt-2">Enter digits only (no spaces or dashes).</p>
                    {(errors.phoneLocalNumber || errors.phone) && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.phoneLocalNumber?.message || errors.phone?.message}
                      </p>
                    )}
                  </div>

                  {/* Gender (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('gender', { required: 'Please select your gender' })}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      defaultValue=""
                      required
                    >
                      <option value="">Please select</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                    {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender.message}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input type="hidden" {...register('dateOfBirth', { required: 'Date of birth is required' })} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      >
                        <option value="">Month</option>
                        {Array.from({ length: 12 }).map((_, i) => {
                          const v = String(i + 1);
                          return (
                            <option key={v} value={v}>
                              {new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' })}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      >
                        <option value="">Day</option>
                        {Array.from({ length: 31 }).map((_, i) => {
                          const v = String(i + 1);
                          return (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      >
                        <option value="">Year</option>
                        {Array.from({ length: 100 }).map((_, i) => {
                          const y = String(new Date().getFullYear() - i);
                          return (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <p className="text-xs text-dark-400 mt-2">We store date of birth in YYYY-MM-DD format.</p>
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-dark-400 mb-2">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <input type="hidden" {...register('nationality', { required: 'Nationality is required' })} />
                    <select
                      value={nationalityCountry.code}
                      onChange={(e) => {
                        const next = COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0];
                        setNationalityCountry(next);
                        setValue('nationality', next.name, { shouldValidate: true });
                      }}
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
                      required
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.nationality && <p className="text-red-400 text-sm mt-1">{errors.nationality.message}</p>}
                  </div>
                </div>
              </div>

              {/* Favorite Players (Optional) */}
              {selectedTour?.productCategory === 'courtside' && availablePlayersForTour.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-dark-700">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-gold-500" />
                    Favorite Players <span className="text-dark-400 font-medium text-base">(Optional)</span>
                  </h3>
                  <p className="text-dark-400 text-sm">
                    Choose any players you support. You can select multiple, or leave blank.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availablePlayersForTour.map((p) => {
                      const checked = favoritePlayerIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-700/60 transition-colors cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFavoritePlayerIds((prev) => Array.from(new Set([...prev, p.id])));
                              } else {
                                setFavoritePlayerIds((prev) => prev.filter((id) => id !== p.id));
                              }
                            }}
                            className="h-4 w-4 accent-(--theme-gold-color)"
                          />
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">
                              #{p.number} {p.name}
                            </div>
                            <div className="text-xs text-dark-400 truncate">{p.team}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {favoritePlayerIds.length > 0 && (
                    <div className="text-sm text-dark-300">
                      Selected: <span className="text-white font-semibold">{favoritePlayerIds.length}</span>
                    </div>
                  )}
                </div>
              )}

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

                {/* Pricing Summary */}
                {selectedTour && (
                  <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">Pricing</p>
                        <p className="text-xs text-dark-400 mt-1">
                          {selectedPricing?.origin ? `Departure: ${selectedPricing.origin}` : 'Departure: N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-dark-400">Total Amount</p>
                        <p className="text-white font-bold text-lg">
                          <span className="text-gold-500 mr-1">{selectedPricing?.currency || selectedTour.pricing.currency}</span>
                          {totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {selectedPricing?.requiresOriginSelection ? (
                      <p className="text-xs text-red-400 mt-3">
                        Please select a departure city to see the correct price.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-dark-400">Adult Unit Price</p>
                          <p className="text-white font-semibold">
                            {selectedPricing?.currency || selectedTour.pricing.currency}{' '}
                            {(selectedPricing?.adult ?? selectedTour.pricing.adult).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-400">Child Unit Price</p>
                          <p className="text-white font-semibold">
                            {selectedPricing?.currency || selectedTour.pricing.currency}{' '}
                            {(selectedPricing?.child ?? selectedTour.pricing.child).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

export default function RegisterPage() {
  // Next.js requires `useSearchParams()` usage to be wrapped in a Suspense boundary
  // to avoid prerender failures during static generation.
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}
