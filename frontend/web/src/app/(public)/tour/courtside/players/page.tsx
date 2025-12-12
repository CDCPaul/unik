'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getPlayers } from '@/lib/services/players';
import type { Player } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';

export default function CourtsidePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      try {
        const allPlayers = await getPlayers();
        // Filter for Courtside players (or all if no productIds set)
        const courtsidePlayers = allPlayers.filter(p => 
          !p.productIds || p.productIds.length === 0 || p.productIds.includes('courtside')
        );
        setPlayers(courtsidePlayers);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-center">
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4" style={{ color: theme.headingText }}>
            Featured Players
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.mutedText }}>
            Meet the Filipino stars you'll see in action during your Courtside experience
          </p>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: theme.cardBg }}>
            <Star className="w-16 h-16 mx-auto mb-4" style={{ color: theme.mutedText }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.headingText }}>
              No Players Available
            </h3>
            <p style={{ color: theme.mutedText }}>
              Player information will be updated soon!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Link href={`/tour/courtside/players/${player.id}`} className="block h-full">
                  <div 
                    className="card h-full overflow-hidden transition-all duration-500 flex flex-col"
                    style={{ borderColor: theme.secondaryBtnBorder }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.goldColor}50`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.secondaryBtnBorder}
                  >
                    {/* Player Image */}
                    <div className="aspect-3/4 relative overflow-hidden" style={{ backgroundColor: theme.cardBg }}>
                      {player.thumbnailUrl ? (
                        <img 
                          src={player.thumbnailUrl} 
                          alt={player.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Star className="w-16 h-16" style={{ color: theme.mutedText }} />
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div 
                        className="absolute inset-0 opacity-80 group-hover:opacity-60 transition-opacity"
                        style={{
                          background: `linear-gradient(to top, ${theme.cardBg}, transparent, transparent)`
                        }}
                      />
                      
                      {/* Jersey Number */}
                      <div 
                        className="absolute top-4 right-4 text-5xl font-display font-bold group-hover:opacity-100 transition-opacity"
                        style={{ 
                          color: `${theme.headingText}10`,
                        }}
                      >
                        #{player.number}
                      </div>

                      {/* All-Star Badge */}
                      {player.isAllStar && (
                        <div className="absolute top-4 left-4">
                          <span 
                            className="text-xs font-bold px-2 py-1 rounded"
                            style={{
                              backgroundColor: theme.goldColor,
                              color: theme.pageBg,
                            }}
                          >
                            ALL-STAR
                          </span>
                        </div>
                      )}
                      
                      {/* Player Info - Overlay on bottom */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 p-5 pt-12"
                        style={{
                          background: `linear-gradient(to top, ${theme.cardBg}, transparent)`
                        }}
                      >
                        <div 
                          className="text-xs font-bold uppercase tracking-widest mb-1"
                          style={{ color: theme.goldColor }}
                        >
                          {player.position}
                        </div>
                        <h3 
                          className="text-2xl font-display font-bold leading-tight mb-1"
                          style={{ color: theme.headingText }}
                        >
                          {player.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm" style={{ color: theme.mutedText }}>
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
  );
}

