'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, Users, RefreshCw } from 'lucide-react';
import { getPlayers } from '@/lib/services/players';
import type { Player } from '@unik/shared/types';
import Link from 'next/link';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPlayers();
        setPlayers(data);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-dark-900" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-gold-500 font-medium uppercase tracking-wider">
              Filipino Stars in KBL
            </span>
            <h1 className="section-heading mt-4 mb-6">
              Meet the Players
            </h1>
            <p className="text-dark-400 text-lg">
              Elite Filipino basketball players competing in the Korean Basketball League.
              Watch them battle it out in the 2026 All-Star Game.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-dark-950 border-y border-dark-800">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-gold-500" />
              <span className="text-white font-semibold">{players.length || 10} Filipino Imports</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-gold-500" />
              <span className="text-white font-semibold">Top Performers</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-gold-500" />
              <span className="text-white font-semibold">All-Star Selection</span>
            </div>
          </div>
        </div>
      </section>

      {/* Players Grid */}
      <section className="py-24 bg-dark-900">
        <div className="container-custom">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-gold-500" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dark-400 text-xl">No players found. Please check back later!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link href={`/players/${player.id}`} className="block h-full">
                    <div className="card h-full overflow-hidden hover:border-gold-500/30 transition-all duration-500 flex flex-col">
                      {/* Player Image */}
                      <div className="aspect-3/4 bg-linear-to-br from-dark-700 to-dark-800 
                                     relative overflow-hidden">
                        {player.thumbnailUrl ? (
                          <img 
                            src={player.thumbnailUrl} 
                            alt={player.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
                            <Star className="w-16 h-16 text-dark-600" />
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-dark-900 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                        
                        {/* Jersey Number */}
                        <div className="absolute top-4 right-4 text-5xl font-display font-bold 
                                       text-white/10 group-hover:text-gold-500/30 transition-colors">
                          #{player.number}
                        </div>

                        {/* All-Star Badge */}
                        {player.isAllStar && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-gold-500 text-dark-900 text-xs font-bold px-2 py-1 rounded">
                              ALL-STAR
                            </span>
                          </div>
                        )}
                        
                        {/* Player Info - Overlay on bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-linear-to-t from-dark-950 to-transparent">
                          <div className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
                            {player.position}
                          </div>
                          <h3 className="text-white text-2xl font-display font-bold leading-tight mb-1">
                            {player.name}
                          </h3>
                          <div className="flex items-center gap-2 text-dark-300 text-sm">
                            <span>{player.team}</span>
                            {player.team && player.hometown && <span>•</span>}
                            <span>{player.hometown}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
