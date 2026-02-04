'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { getRouletteWinners } from '@/lib/services/admin/roulette';
import type { RouletteWinner } from '@unik/shared/types';

export default function RouletteWinnersPage() {
  const [winners, setWinners] = useState<RouletteWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadWinners = async () => {
    setIsLoading(true);
    try {
      const data = await getRouletteWinners();
      setWinners(data);
    } catch (error) {
      console.error('Failed to load roulette winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWinners();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return winners;
    return winners.filter((winner) => {
      const haystack = [
        winner.winnerName,
        winner.winnerContact,
        winner.slotLabel,
        winner.slotGrade,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, winners]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roulette Winners</h1>
          <p className="text-slate-500 mt-1">View the latest winner submissions.</p>
        </div>
        <button onClick={loadWinners} className="admin-btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-card"
      >
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Winners</h2>
          <p className="text-sm text-slate-500 mt-1">
            Name, contact, and prize details are listed below.
          </p>
        </div>

        <div className="p-6 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="admin-input w-72"
              placeholder="Search name, contact, prize, grade"
            />
            <div className="text-sm text-slate-500">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="admin-input w-24"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No winners yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-3 font-medium">Time</th>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Contact</th>
                  <th className="text-left px-6 py-3 font-medium">Prize</th>
                  <th className="text-left px-6 py-3 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((winner) => (
                  <tr key={winner.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-600">
                      {winner.createdAt
                        ? winner.createdAt.toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {winner.winnerName}
                    </td>
                    <td className="px-6 py-3 text-slate-700">{winner.winnerContact}</td>
                    <td className="px-6 py-3 text-slate-900">{winner.slotLabel}</td>
                    <td className="px-6 py-3 text-slate-700 uppercase">
                      {winner.slotGrade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="p-6 border-t border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
            <div>
              Showing {(safePage - 1) * pageSize + 1}-
              {Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className="admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-3">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                className="admin-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
