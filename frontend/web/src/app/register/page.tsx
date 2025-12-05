'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  User, Mail, Phone, Calendar, FileText, Globe, 
  Users, MessageSquare, Send, CheckCircle, AlertCircle,
  Minus, Plus
} from 'lucide-react';

interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests: string;
}

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adultsCount, setAdultsCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationForm>();

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Add companion counts to data
      const formData = {
        ...data,
        adultsCount,
        childrenCount,
      };

      // TODO: Submit to Firebase and send email
      console.log('Form submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      reset();
      setAdultsCount(0);
      setChildrenCount(0);
    } catch (err) {
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustCount = (type: 'adults' | 'children', operation: 'add' | 'subtract') => {
    if (type === 'adults') {
      setAdultsCount(prev => {
        if (operation === 'add' && prev < 10) return prev + 1;
        if (operation === 'subtract' && prev > 0) return prev - 1;
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
              Thank you for your interest in the KBL All-Star 2026 Tour. 
              Our team will contact you within 24-48 hours to confirm your booking 
              and discuss payment details.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="btn-secondary"
            >
              Submit Another Registration
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-900" />
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Secure Your Spot
            </span>
            <h1 className="section-heading mt-4 mb-6">
              Tour Registration
            </h1>
            <p className="text-dark-400 text-lg">
              Fill out the form below to register for the KBL All-Star 2026 Tour.
              Our team will contact you to finalize your booking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-16 bg-dark-900">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="card p-8 md:p-10"
            >
              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Section: Personal Information */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <User className="w-5 h-5 text-gold-500" />
                  Personal Information
                </h2>
                
                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      {...register('fullName', { required: 'Full name is required' })}
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="input-field pl-12"
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="label">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="tel"
                        {...register('phone', { required: 'Phone number is required' })}
                        className="input-field pl-12"
                        placeholder="+63 9XX XXX XXXX"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="label">Date of Birth *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="date"
                        {...register('dateOfBirth', { required: 'Date of birth is required' })}
                        className="input-field pl-12"
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-sm mt-1">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Passport Name */}
                  <div>
                    <label className="label">Passport Name (as shown on passport) *</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="text"
                        {...register('passportName', { required: 'Passport name is required' })}
                        className="input-field pl-12"
                        placeholder="LASTNAME, FIRSTNAME MIDDLENAME"
                      />
                    </div>
                    {errors.passportName && (
                      <p className="text-red-400 text-sm mt-1">{errors.passportName.message}</p>
                    )}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="label">Nationality *</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                      <input
                        type="text"
                        {...register('nationality', { required: 'Nationality is required' })}
                        className="input-field pl-12"
                        placeholder="Filipino"
                      />
                    </div>
                    {errors.nationality && (
                      <p className="text-red-400 text-sm mt-1">{errors.nationality.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Companions */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Users className="w-5 h-5 text-gold-500" />
                  Travel Companions
                </h2>
                <p className="text-dark-400 text-sm mb-6">
                  How many additional travelers will be joining you? (Maximum 10 each)
                </p>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Adults */}
                  <div className="bg-dark-800/50 rounded-xl p-5">
                    <div className="text-dark-300 mb-3">Adults (12 years & above)</div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', 'subtract')}
                        className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center 
                                 text-white hover:bg-dark-600 transition-colors disabled:opacity-50"
                        disabled={adultsCount === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-semibold text-white">{adultsCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('adults', 'add')}
                        className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center 
                                 text-white hover:bg-dark-600 transition-colors disabled:opacity-50"
                        disabled={adultsCount === 10}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="bg-dark-800/50 rounded-xl p-5">
                    <div className="text-dark-300 mb-3">Children (under 12 years)</div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => adjustCount('children', 'subtract')}
                        className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center 
                                 text-white hover:bg-dark-600 transition-colors disabled:opacity-50"
                        disabled={childrenCount === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="text-2xl font-semibold text-white">{childrenCount}</span>
                      <button
                        type="button"
                        onClick={() => adjustCount('children', 'add')}
                        className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center 
                                 text-white hover:bg-dark-600 transition-colors disabled:opacity-50"
                        disabled={childrenCount === 10}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {(adultsCount > 0 || childrenCount > 0) && (
                  <p className="text-gold-400 text-sm mt-4">
                    Total travelers: {1 + adultsCount + childrenCount} (including yourself)
                  </p>
                )}
              </div>

              {/* Section: Special Requests */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gold-500" />
                  Special Requests
                </h2>
                
                <div>
                  <label className="label">Any special requests or requirements? (Optional)</label>
                  <textarea
                    {...register('specialRequests')}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Dietary restrictions, accessibility needs, room preferences, etc."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Registration
                  </span>
                )}
              </button>

              <p className="text-dark-500 text-sm text-center mt-4">
                By submitting, you agree to our terms and conditions. 
                Our team will contact you within 24-48 hours.
              </p>
            </motion.form>
          </div>
        </div>
      </section>
    </>
  );
}

