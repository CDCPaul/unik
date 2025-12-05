'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye, ChevronDown } from 'lucide-react';

type RegistrationStatus = 'all' | 'new' | 'contacted' | 'confirmed' | 'cancelled';

const mockRegistrations = [
  { 
    id: '1', 
    name: 'Juan dela Cruz', 
    email: 'juan@email.com', 
    phone: '+63 912 345 6789',
    date: '2025-12-05', 
    status: 'new',
    adults: 2,
    children: 1,
  },
  { 
    id: '2', 
    name: 'Maria Santos', 
    email: 'maria@email.com', 
    phone: '+63 923 456 7890',
    date: '2025-12-04', 
    status: 'contacted',
    adults: 1,
    children: 0,
  },
  { 
    id: '3', 
    name: 'Pedro Garcia', 
    email: 'pedro@email.com', 
    phone: '+63 934 567 8901',
    date: '2025-12-04', 
    status: 'confirmed',
    adults: 4,
    children: 2,
  },
  { 
    id: '4', 
    name: 'Ana Reyes', 
    email: 'ana@email.com', 
    phone: '+63 945 678 9012',
    date: '2025-12-03', 
    status: 'new',
    adults: 2,
    children: 0,
  },
  { 
    id: '5', 
    name: 'Jose Cruz', 
    email: 'jose@email.com', 
    phone: '+63 956 789 0123',
    date: '2025-12-03', 
    status: 'contacted',
    adults: 3,
    children: 1,
  },
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

export default function RegistrationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRegistrations = mockRegistrations.filter(reg => {
    const matchesSearch = reg.name.toLowerCase().includes(search.toLowerCase()) ||
                         reg.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id: string, newStatus: string) => {
    // TODO: Update status in Firebase
    console.log('Update status:', id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-slate-500 mt-1">Manage tour registrations</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus)}
              className="input-field pl-10 pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Travelers</th>
                <th className="table-header">Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50">
                  <td className="table-cell">
                    <div className="font-medium">{reg.name}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-slate-900">{reg.email}</div>
                    <div className="text-slate-500 text-xs">{reg.phone}</div>
                  </td>
                  <td className="table-cell">
                    <div className="text-slate-900">{reg.adults} Adults</div>
                    {reg.children > 0 && (
                      <div className="text-slate-500 text-xs">{reg.children} Children</div>
                    )}
                  </td>
                  <td className="table-cell text-slate-500">{reg.date}</td>
                  <td className="table-cell">
                    <select
                      value={reg.status}
                      onChange={(e) => updateStatus(reg.id, e.target.value)}
                      className={`${getStatusBadge(reg.status)} cursor-pointer border-0 pr-6 appearance-none`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => setSelectedId(reg.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No registrations found matching your criteria.
          </div>
        )}
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{mockRegistrations.length}</div>
          <div className="text-sm text-slate-500">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {mockRegistrations.filter(r => r.status === 'new').length}
          </div>
          <div className="text-sm text-slate-500">New</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {mockRegistrations.filter(r => r.status === 'contacted').length}
          </div>
          <div className="text-sm text-slate-500">Contacted</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {mockRegistrations.filter(r => r.status === 'confirmed').length}
          </div>
          <div className="text-sm text-slate-500">Confirmed</div>
        </div>
      </div>
    </div>
  );
}

