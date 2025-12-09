'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, BarChart2, Star, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getPlayer } from '@/lib/services/players';
import type { Player } from '@unik/shared/types';
import { useParams } from 'next/navigation';

export default function PlayerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      try {
        const data = await getPlayer(id);
        setPlayer(data);
      } catch (error) {
        console.error('Failed to load player:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-center bg-dark-900">
        <RefreshCw className="w-10 h-10 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen pt-32 flex flex-col justify-center items-center bg-dark-900 text-white">
        <h1 className="text-3xl font-display font-bold mb-4">Player Not Found</h1>
        <Link href="/players" className="text-gold-500 hover:text-gold-400 flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Players
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="pt-32 pb-20 bg-dark-900 min-h-screen">
        <div className="container-custom">
          {/* Back Button */}
          <Link href="/players" className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Players
          </Link>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column: Images */}
            <div className="lg:col-span-5 space-y-6">
              {/* Main Photo */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="aspect-3/4 rounded-2xl overflow-hidden bg-dark-800 relative shadow-2xl border border-dark-700"
              >
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-dark-600">
                    <Star className="w-20 h-20" />
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-dark-900 via-transparent to-transparent opacity-60" />
                
                {/* Name Overlay (Mobile) */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:hidden">
                  <h1 className="text-3xl font-display font-bold text-white mb-1">{player.name}</h1>
                  <p className="text-gold-500 font-medium">{player.team}</p>
                </div>
              </motion.div>

              {/* Action Shot (if available) */}
              {player.actionPhotoUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="aspect-video rounded-2xl overflow-hidden bg-dark-800 border border-dark-700 shadow-xl"
                >
                  <img src={player.actionPhotoUrl} alt={`${player.name} action`} className="w-full h-full object-cover" />
                </motion.div>
              )}
            </div>

            {/* Right Column: Info */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Header (Desktop) */}
                <div className="hidden lg:block mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-gold-500 font-bold tracking-wider text-sm uppercase bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                      {player.position}
                    </span>
                    {player.isAllStar && (
                      <span className="text-dark-900 font-bold tracking-wider text-sm uppercase bg-gold-500 px-3 py-1 rounded-full">
                        All-Star {player.allStarYear}
                      </span>
                    )}
                  </div>
                  <h1 className="text-5xl font-display font-bold text-white mb-2">{player.name}</h1>
                  <div className="flex items-center gap-4 text-xl text-dark-300">
                    <span className="text-white font-medium">{player.team}</span>
                    <span>•</span>
                    <span>#{player.number}</span>
                    <span>•</span>
                    <span>{player.height}</span>
                  </div>
                </div>

                {/* Bio */}
                <div className="prose prose-invert max-w-none mb-10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold-500" /> About
                  </h3>
                  <p className="text-dark-300 text-lg leading-relaxed whitespace-pre-wrap">
                    {player.bio || "No bio available."}
                  </p>
                </div>

                {/* Stats & Achievements Grid */}
                <div className="grid sm:grid-cols-2 gap-8 mb-10">
                  {/* Stats */}
                  {player.stats && (
                    <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-gold-500" /> Season Stats
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{player.stats.ppg}</div>
                          <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">PPG</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{player.stats.apg}</div>
                          <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">APG</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">{player.stats.rpg}</div>
                          <div className="text-xs text-dark-400 uppercase tracking-wider mt-1">RPG</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {player.achievements && player.achievements.length > 0 && (
                    <div className="bg-dark-800/50 rounded-2xl p-6 border border-dark-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gold-500" /> Achievements
                      </h3>
                      <ul className="space-y-2">
                        {player.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start gap-2 text-dark-300 text-sm">
                            <span className="text-gold-500 mt-1">✓</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Highlight Video (if available) */}
                {player.highlightVideoUrl && (
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-white mb-4">Highlight Reel</h3>
                    <div className="aspect-video rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
                      <iframe 
                        src={player.highlightVideoUrl.replace('watch?v=', 'embed/')} 
                        title="Player Highlights"
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

