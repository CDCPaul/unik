'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MapPin, FileText, Image, Plus, Edit2, Trash2, 
  ChevronRight, Eye, Save 
} from 'lucide-react';
import Link from 'next/link';

const contentSections = [
  {
    id: 'players',
    title: 'Players',
    description: 'Manage player profiles and information',
    icon: Users,
    count: 10,
    href: '/content/players',
  },
  {
    id: 'tour',
    title: 'Tour Package',
    description: 'Edit tour details, itinerary, and pricing',
    icon: MapPin,
    count: 1,
    href: '/content/tour',
  },
  {
    id: 'info',
    title: 'Info Sections',
    description: 'Manage travel information and FAQ',
    icon: FileText,
    count: 6,
    href: '/content/info',
  },
  {
    id: 'gallery',
    title: 'Gallery',
    description: 'Upload and manage images',
    icon: Image,
    count: 12,
    href: '/content/gallery',
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
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={section.href}
              className="card p-6 flex items-start gap-4 hover:shadow-md transition-all group"
            >
              <div className="p-3 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-100 transition-colors">
                <section.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{section.title}</h3>
                  <span className="text-sm text-slate-500">{section.count} items</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{section.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">10</div>
            <div className="text-sm text-slate-500">Players</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">4</div>
            <div className="text-sm text-slate-500">Tour Days</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">6</div>
            <div className="text-sm text-slate-500">Info Sections</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">12</div>
            <div className="text-sm text-slate-500">Gallery Images</div>
          </div>
        </div>
      </motion.div>

      {/* Recent Edits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Edits</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {[
            { type: 'Player', name: 'Justin Brownlee', action: 'Updated', time: '2 hours ago' },
            { type: 'Tour', name: 'Day 2 Itinerary', action: 'Modified', time: '5 hours ago' },
            { type: 'Gallery', name: '3 new images', action: 'Added', time: '1 day ago' },
            { type: 'Info', name: 'Visa Requirements', action: 'Updated', time: '2 days ago' },
          ].map((edit, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-900">{edit.name}</span>
                <span className="text-sm text-slate-500 ml-2">({edit.type})</span>
              </div>
              <div className="text-sm text-slate-500">
                {edit.action} • {edit.time}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}



