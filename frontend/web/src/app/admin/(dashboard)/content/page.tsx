'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

const products = [
  {
    title: 'Courtside (KBL)',
    description: 'Manage Courtside tour, players, and gallery',
    icon: MapPin,
    href: '/admin/content/courtside',
    color: 'bg-blue-600',
    badge: 'KBL All-Star 2026',
  },
  {
    title: 'Cherry Blossom Marathon',
    description: 'Manage CBM tour, itinerary, schedule, and gallery',
    icon: MapPin,
    href: '/admin/content/cherry-blossom',
    color: 'bg-pink-600',
    badge: 'CBM',
  },
];

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
        <p className="text-slate-500 mt-1">Choose a product to manage its content</p>
      </div>

      {/* Content Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((section, index) => (
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

      <div className="admin-card p-4 bg-slate-50 border-slate-200">
        <div className="text-sm text-slate-600">
          Tip: This is now <span className="font-semibold">product-scoped</span>. Courtside and CBM can be managed independently.
        </div>
      </div>
    </div>
  );
}
