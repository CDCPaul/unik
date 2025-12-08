'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, ChevronDown, RefreshCw } from 'lucide-react';
import { getRegistrations, updateRegistrationStatus, getRegistrationStats } from '@/lib/services/admin/registrations';

type RegistrationStatus = 'new' | 'contacted' | 'confirmed' | 'cancelled';

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportName: string;
  nationality: string;
  adultsCount: number;
  childrenCount: number;
  specialRequests?: string;
  status: RegistrationStatus;
  createdAt?: Date;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'new':
      return 'admin-badge admin-badge-new';
    case 'contacted':
      return 'admin-badge admin-badge-contacted';
    case 'confirmed':
      return 'admin-badge admin-badge-confirmed';
    case 'cancelled':
      return 'admin-badge admin-badge-cancelled';
    default:
      return 'admin-badge';
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, confirmed: 0, cancelled: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [regs, statsData] = await Promise.all([
        getRegistrations(),
        getRegistrationStats(),
      ]);
      setRegistrations(regs);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: RegistrationStatus) => {
    try {
      await updateRegistrationStatus(id, newStatus);
      setRegistrations(prev => 
        prev.map(reg => reg.id === id ? { ...reg, status: newStatus } : reg)
      );
      const statsData = await getRegistrationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         reg.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Date of Birth', 'Passport Name', 'Nationality', 'Adults', 'Children', 'Special Requests', 'Status', 'Created At'];
    const rows = filteredRegistrations.map(reg => [
      reg.fullName,
      reg.email,
      reg.phone,
      reg.dateOfBirth,
      reg.passportName,
      reg.nationality,
      reg.adultsCount,
      reg.childrenCount,
      reg.specialRequests || '',
      reg.status,
      formatDate(reg.createdAt),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-slate-500 mt-1">Manage tour registrations</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="admin-btn-secondary" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={exportToCSV} className="admin-btn-secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input pl-10"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'all')}
              className="admin-input pl-10 pr-10 appearance-none cursor-pointer"
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
        className="admin-card overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            Loading registrations...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="admin-table-header">Name</th>
                  <th className="admin-table-header">Contact</th>
                  <th className="admin-table-header">Travelers</th>
                  <th className="admin-table-header">Date</th>
                  <th className="admin-table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="admin-table-cell">
                      <div className="font-medium">{reg.fullName}</div>
                      <div className="text-slate-500 text-xs">{reg.passportName}</div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="text-slate-900">{reg.email}</div>
                      <div className="text-slate-500 text-xs">{reg.phone}</div>
                    </td>
                    <td className="admin-table-cell">
                      <div className="text-slate-900">{1 + reg.adultsCount} Adults</div>
                      {reg.childrenCount > 0 && (
                        <div className="text-slate-500 text-xs">{reg.childrenCount} Children</div>
                      )}
                    </td>
                    <td className="admin-table-cell text-slate-500">{formatDate(reg.createdAt)}</td>
                    <td className="admin-table-cell">
                      <select
                        value={reg.status}
                        onChange={(e) => handleStatusChange(reg.id, e.target.value as RegistrationStatus)}
                        className={`${getStatusBadge(reg.status)} cursor-pointer border-0 pr-6 appearance-none`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredRegistrations.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No registrations found matching your criteria.
          </div>
        )}
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-500">Total</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-sm text-slate-500">New</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
          <div className="text-sm text-slate-500">Contacted</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-slate-500">Confirmed</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-slate-500">Cancelled</div>
        </div>
      </div>
    </div>
  );
}

