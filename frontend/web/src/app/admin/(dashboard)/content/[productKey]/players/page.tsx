'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { getPlayers } from '@/lib/services/admin/players';
import type { Player } from '@unik/shared/types';

type ProductKey = 'courtside' | 'cherry-blossom';

function normalizeProductKey(key: string): ProductKey | null {
  if (key === 'courtside') return 'courtside';
  if (key === 'cherry-blossom') return 'cherry-blossom';
  return null;
}

export default function PlayersByProductPage() {
  const params = useParams();
  const productKey = normalizeProductKey(String(params.productKey || ''));
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const all = await getPlayers();
        setPlayers(all);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  if (!productKey) {
    return (
      <div className="admin-card p-6">
        <div className="text-slate-900 font-semibold mb-1">Unknown product</div>
        <div className="text-slate-500 text-sm">Go back to Content and choose a valid product.</div>
      </div>
    );
  }

  // Courtside: show real editor link. Cherry-blossom: players not used (for now).
  if (productKey !== 'courtside') {
    return (
      <div className="space-y-4">
        <Link href={`/admin/content/${productKey}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
            <Users className="w-4 h-4" /> Players
          </div>
          <div className="text-slate-500 text-sm">
            Cherry Blossom Marathon does not use Players currently. (If you want, we can enable product-specific players later.)
          </div>
        </div>
      </div>
    );
  }

  const courtsidePlayers = useMemo(() => {
    return players.filter((p) => !p.productIds?.length || p.productIds.includes('courtside'));
  }, [players]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/admin/content/${productKey}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Link href="/admin/content/players" className="admin-btn-secondary">
          Open Player Editor
        </Link>
      </div>

      <div className="admin-card p-6">
        <div className="text-slate-900 font-semibold mb-2">Courtside Players</div>
        <div className="text-slate-500 text-sm">
          Showing {isLoading ? '...' : courtsidePlayers.length} players (players with no productIds are treated as Courtside).
        </div>
      </div>
    </div>
  );
}


