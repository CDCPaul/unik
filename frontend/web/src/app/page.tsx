'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, MapPin, Users, Trophy, Plane, Hotel, 
  Ticket, Star, ArrowRight, Play, Sparkles 
} from 'lucide-react';

const highlights = [
  {
    icon: Trophy,
    title: 'KBL All-Star 2026',
    description: 'Watch Filipino imports battle in the ultimate basketball showdown',
  },
  {
    icon: Plane,
    title: 'Round Trip Flight',
    description: 'Direct flights from Manila to Seoul included',
  },
  {
    icon: Hotel,
    title: 'Premium Stay',
    description: '4-star hotel accommodation in the heart of Seoul',
  },
  {
    icon: Users,
    title: 'Meet & Greet',
    description: 'Exclusive access to meet Filipino players',
  },
];

const stats = [
  { value: '4', label: 'Days' },
  { value: '10', label: 'Filipino Stars' },
  { value: '2', label: 'Games' },
  { value: '∞', label: 'Memories' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl animate-pulse-slow animate-delay-200" />
        
        {/* Content */}
        <div className="relative container-custom py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                         bg-gold-500/10 border border-gold-500/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">January 15-18, 2026</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight"
            >
              <span className="text-white">Experience the</span>
              <br />
              <span className="gradient-text">KBL All-Star 2026</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-dark-300 mb-10 max-w-2xl mx-auto"
            >
              Witness Filipino basketball stars shine in Korea. 
              Your all-inclusive tour awaits.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/register" className="btn-gold text-lg px-8 py-4">
                <Ticket className="w-5 h-5 mr-2" />
                Book Your Spot
              </Link>
              <Link href="/tour" className="btn-secondary text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                View Package
              </Link>
            </motion.div>

            {/* Event Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8"
            >
              <div className="flex items-center gap-2 text-dark-400">
                <Calendar className="w-5 h-5 text-gold-500" />
                <span>Jan 15-18, 2026</span>
              </div>
              <div className="flex items-center gap-2 text-dark-400">
                <MapPin className="w-5 h-5 text-gold-500" />
                <span>Seoul, South Korea</span>
              </div>
              <div className="flex items-center gap-2 text-dark-400">
                <Users className="w-5 h-5 text-gold-500" />
                <span>Limited Slots</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-dark-500 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gold-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-dark-950 border-y border-dark-800">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-display font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-dark-400 uppercase tracking-wider text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-gold-500 font-medium uppercase tracking-wider"
            >
              What&apos;s Included
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-heading mt-4"
            >
              Tour Highlights
            </motion.h2>
          </div>

          {/* Highlights Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 text-center group hover:border-gold-500/30 transition-all duration-500"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                               bg-gradient-to-br from-gold-500/20 to-primary-500/20 
                               group-hover:from-gold-500/30 group-hover:to-primary-500/30
                               transition-all duration-500 mb-6">
                  <item.icon className="w-8 h-8 text-gold-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-dark-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Players Preview */}
      <section className="py-24 bg-premium-gradient relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold-500/5 to-transparent" />
        
        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-gold-500 font-medium uppercase tracking-wider">
                Filipino Stars
              </span>
              <h2 className="section-heading mt-4 mb-6">
                10 Elite Players.<br />One Epic Event.
              </h2>
              <p className="text-dark-400 text-lg leading-relaxed mb-8">
                Watch your favorite Filipino imports compete in the KBL All-Star Game. 
                From powerful dunks to clutch shots, witness basketball excellence 
                at its finest.
              </p>
              <Link 
                href="/players" 
                className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 
                          font-medium transition-colors group"
              >
                Meet the Players
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Player Cards Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl bg-dark-800/50 border border-dark-700/50 
                              flex items-center justify-center overflow-hidden group"
                  >
                    <div className="text-center p-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-dark-700 mb-3 
                                    flex items-center justify-center">
                        <Star className="w-8 h-8 text-gold-500/50" />
                      </div>
                      <div className="text-white font-medium">Player {i}</div>
                      <div className="text-dark-500 text-sm">Coming Soon</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Decorative element */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-premium p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/cta-pattern.svg')] opacity-5" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <span className="text-gold-500 font-medium uppercase tracking-wider">
                Limited Availability
              </span>
              <h2 className="section-heading mt-4 mb-6">
                Ready for the Experience<br />of a Lifetime?
              </h2>
              <p className="text-dark-400 text-lg max-w-2xl mx-auto mb-10">
                Don&apos;t miss this once-in-a-lifetime opportunity to witness 
                Filipino basketball stars in action. Secure your spot today.
              </p>
              <Link href="/register" className="btn-gold text-lg px-10 py-4">
                <Ticket className="w-5 h-5 mr-2" />
                Reserve Your Spot Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

