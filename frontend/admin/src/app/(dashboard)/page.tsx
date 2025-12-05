'use client';

import { motion } from 'framer-motion';
import { Users, Eye, MousePointer, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  { 
    label: 'Total Registrations', 
    value: '124', 
    change: '+12%', 
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500'
  },
  { 
    label: 'Page Views (Today)', 
    value: '1,234', 
    change: '+8%', 
    trend: 'up',
    icon: Eye,
    color: 'bg-green-500'
  },
  { 
    label: 'Click Rate', 
    value: '4.5%', 
    change: '-2%', 
    trend: 'down',
    icon: MousePointer,
    color: 'bg-yellow-500'
  },
  { 
    label: 'Conversion Rate', 
    value: '2.8%', 
    change: '+5%', 
    trend: 'up',
    icon: TrendingUp,
    color: 'bg-purple-500'
  },
];

const recentRegistrations = [
  { id: 1, name: 'Juan dela Cruz', email: 'juan@email.com', date: '2025-12-05', status: 'new' },
  { id: 2, name: 'Maria Santos', email: 'maria@email.com', date: '2025-12-04', status: 'contacted' },
  { id: 3, name: 'Pedro Garcia', email: 'pedro@email.com', date: '2025-12-04', status: 'confirmed' },
  { id: 4, name: 'Ana Reyes', email: 'ana@email.com', date: '2025-12-03', status: 'new' },
  { id: 5, name: 'Jose Cruz', email: 'jose@email.com', date: '2025-12-03', status: 'contacted' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new':
      return 'badge badge-new';
    case 'contacted':
      return 'badge badge-contacted';
    case 'confirmed':
      return 'badge badge-confirmed';
    case 'cancelled':
      return 'badge badge-cancelled';
    default:
      return 'badge';
  }
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Registrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Registrations</h2>
            <a href="/registrations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{reg.name}</td>
                  <td className="table-cell text-slate-500">{reg.email}</td>
                  <td className="table-cell text-slate-500">{reg.date}</td>
                  <td className="table-cell">
                    <span className={getStatusBadge(reg.status)}>
                      {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <a href="/navigation" className="card p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Edit Navigation</h3>
          <p className="text-sm text-slate-500">Change menu names and order</p>
        </a>
        <a href="/content" className="card p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Manage Content</h3>
          <p className="text-sm text-slate-500">Update players and tour info</p>
        </a>
        <a href="/theme" className="card p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 mb-2">Customize Theme</h3>
          <p className="text-sm text-slate-500">Change colors and styles</p>
        </a>
      </motion.div>
    </div>
  );
}

