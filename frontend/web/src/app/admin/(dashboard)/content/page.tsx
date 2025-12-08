'use client';

import { motion } from 'framer-motion';
import { FileText, Users, Image, MapPin } from 'lucide-react';
import Link from 'next/link';

const contentSections = [
  {
    title: 'Players',
    description: 'Manage player profiles and information',
    icon: Users,
    href: '/admin/content/players',
    color: 'bg-blue-500',
  },
  {
    title: 'Tour Packages',
    description: 'Edit tour package details and pricing',
    icon: MapPin,
    href: '/admin/content/tours',
    color: 'bg-green-500',
  },
  {
    title: 'Gallery',
    description: 'Upload and manage photos',
    icon: Image,
    href: '/admin/content/gallery',
    color: 'bg-purple-500',
  },
  {
    title: 'Pages',
    description: 'Edit page content and text',
    icon: FileText,
    href: '/admin/content/pages',
    color: 'bg-orange-500',
  },
];

export default function ContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
        <p className="text-slate-500 mt-1">Manage all website content from here</p>
      </div>

      {/* Content Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={section.href} className="block">
              <div className="admin-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{section.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">12</div>
          <div className="text-sm text-slate-500">Players</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">3</div>
          <div className="text-sm text-slate-500">Tour Packages</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">24</div>
          <div className="text-sm text-slate-500">Gallery Images</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">6</div>
          <div className="text-sm text-slate-500">Pages</div>
        </div>
      </div>
    </div>
  );
}

