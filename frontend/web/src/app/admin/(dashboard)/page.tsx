'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Image, TrendingUp } from 'lucide-react';
import { getRegistrationStats } from '@/lib/services/admin/registrations';
import Link from 'next/link';

interface Stats {
  registrations: {
    total: number;
    new: number;
    contacted: number;
    confirmed: number;
  };
  players: number;
  tours: number;
  gallery: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    registrations: { total: 0, new: 0, contacted: 0, confirmed: 0 },
    players: 0,
    tours: 0,
    gallery: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const regStats = await getRegistrationStats();
      setStats({
        registrations: regStats,
        players: 0, // TODO: Load from Firebase
        tours: 0,
        gallery: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Registrations',
      value: stats.registrations.total,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/registrations',
    },
    {
      label: 'New Applications',
      value: stats.registrations.new,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/admin/registrations',
    },
    {
      label: 'Players',
      value: stats.players,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/content/players',
    },
    {
      label: 'Gallery Images',
      value: stats.gallery,
      icon: Image,
      color: 'bg-orange-500',
      href: '/admin/content/gallery',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Players',
      description: 'Add or edit Filipino All-Star players',
      href: '/admin/content/players',
      icon: Users,
    },
    {
      title: 'Tour Package',
      description: 'Update tour details and itinerary',
      href: '/admin/content/tours',
      icon: FileText,
    },
    {
      title: 'Gallery',
      description: 'Upload photos and videos',
      href: '/admin/content/gallery',
      icon: Image,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">KBL All-Star 2026 Tour Management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={stat.href}>
              <div className="admin-card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-900">
                    {isLoading ? '...' : stat.value}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Link href={action.href}>
                <div className="admin-card p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-100">
                      <action.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      {stats.registrations.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="admin-card p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Registration Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.registrations.new}</div>
              <div className="text-sm text-slate-500">New</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.registrations.contacted}</div>
              <div className="text-sm text-slate-500">Contacted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.registrations.confirmed}</div>
              <div className="text-sm text-slate-500">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.registrations.total}</div>
              <div className="text-sm text-slate-500">Total</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
