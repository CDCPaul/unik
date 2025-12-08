'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Image } from 'lucide-react';
import Link from 'next/link';

const contentSections = [
  {
    title: 'Players',
    description: '10 Filipino All-Stars profiles and stats',
    icon: Users,
    href: '/admin/content/players',
    color: 'bg-blue-500',
    badge: 'KBL All-Star 2026',
  },
  {
    title: 'Tour Package',
    description: 'Edit tour details, itinerary, and pricing',
    icon: MapPin,
    href: '/admin/content/tours',
    color: 'bg-green-500',
    badge: 'Jan 15-18, 2026',
  },
  {
    title: 'Gallery',
    description: 'Upload and manage photos',
    icon: Image,
    href: '/admin/content/gallery',
    color: 'bg-purple-500',
  },
];

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
        <p className="text-slate-500 mt-1">Manage all website content for KBL All-Star 2026 Tour</p>
      </div>

      {/* Content Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contentSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={section.href}>
              <div className="admin-card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    {section.badge && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-slate-500">{section.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="admin-card p-6 bg-blue-50 border-blue-200"
      >
        <h3 className="font-medium text-blue-900 mb-2">🏀 KBL All-Star 2026</h3>
        <p className="text-sm text-blue-700">
          Filipino Basketball Pride: 10 Filipino players vs 10 Korean players at Jamsil Arena, Seoul on January 17, 2026.
        </p>
      </motion.div>
    </div>
  );
}
