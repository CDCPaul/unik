'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Mail, Phone, MapPin, Clock, Send, 
  CheckCircle, AlertCircle, Facebook, Instagram, Twitter
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { settings, isLoading } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const emails =
    mounted && settings
      ? ((settings.contactEmails?.length ? settings.contactEmails : settings.contactEmail ? [settings.contactEmail] : []).filter(Boolean))
      : [];
  const phones =
    mounted && settings
      ? ((settings.contactPhones?.length ? settings.contactPhones : settings.contactPhone ? [settings.contactPhone] : []).filter(Boolean))
      : [];
  const vibers =
    mounted && settings
      ? ((settings.contactVibers?.length ? settings.contactVibers : settings.contactViber ? [settings.contactViber] : []).filter(Boolean))
      : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>();

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Submit to Firebase and send email
      console.log('Contact form submitted:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      reset();
    } catch (err) {
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = mounted && settings ? [
    {
      icon: Mail,
      title: 'Email',
      items: emails.map(v => ({ text: v, href: `mailto:${v}` })),
    },
    {
      icon: Phone,
      title: 'Phone',
      items: phones.map(v => ({ text: v, href: `tel:${v}` })),
    },
    {
      icon: Phone,
      title: 'Viber',
      items: vibers.map(v => ({ text: v, href: `tel:${v}` })),
    },
    {
      icon: MapPin,
      title: 'Office',
      items: [{ text: settings.officeAddress, href: null }],
    },
    {
      icon: Clock,
      title: 'Hours',
      items: [{ text: 'Mon-Fri: 9AM - 6PM (PHT)', href: null }],
    },
  ] : [];

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Get in Touch
            </span>
            <h1 className="section-heading mt-4 mb-6">
              Contact Us
            </h1>
            <p className="text-dark-400 text-lg">
              Have questions about the tour? We&apos;re here to help. 
              Reach out and our team will get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl font-semibold text-white mb-8">
                Contact Information
              </h2>

              <div className="space-y-6 mb-10">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <div className="text-dark-400 text-sm mb-1">{item.title}</div>
                      <div className="space-y-1">
                        {item.items.map((row, idx) =>
                          row.href ? (
                            <a
                              key={`${item.title}-${idx}`}
                              href={row.href}
                              className="block text-white hover:text-gold-400 transition-colors break-all"
                            >
                              {row.text}
                            </a>
                          ) : (
                            <span key={`${item.title}-${idx}`} className="block text-white">
                              {row.text}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-white font-medium mb-4">Follow Us</h3>
                <div className="flex items-center gap-3">
                  {settings?.socialMedia?.facebook && (
                    <a
                      href={settings.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center
                               text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {settings?.socialMedia?.instagram && (
                    <a
                      href={settings.socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center
                               text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {settings?.socialMedia?.twitter && (
                    <a
                      href={settings.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center
                               text-dark-400 hover:text-white hover:bg-dark-700 transition-all"
                      aria-label="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              {isSuccess ? (
                <div className="card p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Message Sent!
                  </h3>
                  <p className="text-dark-400 mb-6">
                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="card p-8">
                  <h2 className="text-2xl font-semibold text-white mb-6">
                    Send us a Message
                  </h2>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="label">Your Name *</label>
                      <input
                        type="text"
                        {...register('name', { required: 'Name is required' })}
                        className="input-field"
                        placeholder="Enter your name"
                      />
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="input-field"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="label">Subject *</label>
                      <input
                        type="text"
                        {...register('subject', { required: 'Subject is required' })}
                        className="input-field"
                        placeholder="What is this about?"
                      />
                      {errors.subject && (
                        <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <label className="label">Message *</label>
                      <textarea
                        {...register('message', { required: 'Message is required' })}
                        rows={5}
                        className="input-field resize-none"
                        placeholder="How can we help you?"
                      />
                      {errors.message && (
                        <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold w-full mt-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        Send Message
                      </span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
