'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Trophy, Star, RefreshCw } from 'lucide-react';
import { getPlayer } from '@/lib/services/players';
import type { Player } from '@unik/shared/types';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function CourtsidePlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadPlayer() {
      try {
        const data = await getPlayer(playerId);
        
        // Check if player is part of courtside product
        if (data && data.productIds && data.productIds.includes('courtside')) {
          setPlayer(data);
        } else if (data && !data.productIds) {
          // Legacy support: if no productIds, show anyway
          setPlayer(data);
        } else {
          // Player not part of courtside
          router.push('/tour/courtside/players');
        }
      } catch (error) {
        console.error('Failed to load player:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlayer();
  }, [playerId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-center" style={{ backgroundColor: theme.pageBg }}>
        <RefreshCw className="w-10 h-10 animate-spin" style={{ color: theme.goldColor }} />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen pt-32 flex flex-col justify-center items-center container-custom text-center" style={{ backgroundColor: theme.pageBg }}>
        <h1 className="text-3xl font-display font-bold mb-4" style={{ color: theme.headingText }}>Player Not Found</h1>
        <p className="mb-8" style={{ color: theme.mutedText }}>This player is not part of the Courtside tour.</p>
        <Link href="/tour/courtside/players" className="btn-primary">Back to Players</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.pageBg, minHeight: '100vh' }}>
      {/* Back Button */}
      <div className="container-custom pt-32 pb-8">
        <Link 
          href="/tour/courtside/players"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-opacity-80"
          style={{ color: theme.bodyText, backgroundColor: theme.cardBg }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </Link>
      </div>

      {/* Hero Section */}
      <section className="pb-16">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Player Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="aspect-3/4 rounded-2xl overflow-hidden border-2 shadow-2xl relative"
                style={{ borderColor: theme.goldColor }}
              >
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : player.thumbnailUrl ? (
                  <img
                    src={player.thumbnailUrl}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: theme.cardBg }}>
                    <Star className="w-24 h-24" style={{ color: theme.mutedText }} />
                  </div>
                )}
                
                {/* Jersey Number Overlay */}
                <div className="absolute top-8 right-8 text-9xl font-display font-bold opacity-20"
                  style={{ color: theme.headingText }}
                >
                  #{player.number}
                </div>

                {/* All-Star Badge */}
                {player.isAllStar && (
                  <div className="absolute top-8 left-8">
                    <span className="px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
                      style={{ backgroundColor: theme.goldColor, color: theme.pageBg }}
                    >
                      ⭐ ALL-STAR
                    </span>
                  </div>
                )}
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full blur-3xl"
                style={{ backgroundColor: `${theme.goldColor}30` }}
              />
            </motion.div>

            {/* Player Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Name & Position */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${theme.goldColor}20`, color: theme.goldColor }}
                  >
                    {player.position}
                  </span>
                  <span className="text-4xl font-bold" style={{ color: theme.goldColor }}>
                    #{player.number}
                  </span>
                </div>
                <h1 className="text-5xl font-display font-bold mb-4" style={{ color: theme.headingText }}>
                  {player.name}
                </h1>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4" style={{ color: theme.goldColor }} />
                    <span className="text-sm" style={{ color: theme.mutedText }}>Team</span>
                  </div>
                  <p className="font-bold text-lg" style={{ color: theme.headingText }}>{player.team}</p>
                </div>

                <div className="card p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: theme.goldColor }} />
                    <span className="text-sm" style={{ color: theme.mutedText }}>Hometown</span>
                  </div>
                  <p className="font-bold text-lg" style={{ color: theme.headingText }}>{player.hometown}</p>
                </div>

                {player.height && (
                  <div className="card p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                    <span className="text-sm block mb-1" style={{ color: theme.mutedText }}>Height</span>
                    <p className="font-bold text-lg" style={{ color: theme.headingText }}>{player.height}</p>
                  </div>
                )}

                {player.dateOfBirth && (
                  <div className="card p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" style={{ color: theme.goldColor }} />
                      <span className="text-sm" style={{ color: theme.mutedText }}>Born</span>
                    </div>
                    <p className="font-bold text-lg" style={{ color: theme.headingText }}>
                      {new Date(player.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Bio */}
              {player.bio && (
                <div className="card p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: theme.headingText }}>About</h2>
                  <p className="leading-relaxed" style={{ color: theme.bodyText }}>{player.bio}</p>
                </div>
              )}

              {/* Achievements */}
              {player.achievements && player.achievements.length > 0 && (
                <div className="card p-6" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBg }}>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.headingText }}>
                    <Trophy className="w-5 h-5" style={{ color: theme.goldColor }} />
                    Achievements
                  </h2>
                  <ul className="space-y-2">
                    {player.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span style={{ color: theme.goldColor }}>•</span>
                        <span style={{ color: theme.bodyText }}>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Action Shot Section */}
      {player.actionPhotoUrl && (
        <section className="py-16">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-display font-bold mb-8 text-center" style={{ color: theme.headingText }}>
                Action Shot
              </h2>
              <div className="max-w-5xl mx-auto">
                <div className="aspect-video rounded-2xl overflow-hidden border-2 shadow-2xl"
                  style={{ borderColor: theme.goldColor }}
                >
                  <img
                    src={player.actionPhotoUrl}
                    alt={`${player.name} action`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 border-t" style={{ borderColor: theme.cardBg }}>
        <div className="container-custom text-center">
          <h2 className="text-3xl font-display font-bold mb-4" style={{ color: theme.headingText }}>
            Watch {player.name} Live!
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: theme.bodyText }}>
            Join us on the Courtside tour and experience the excitement of watching Filipino basketball stars compete in Korea.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/tour/courtside" className="btn-gold">
              View Tour Details
            </Link>
            <Link href="/register" className="btn-primary">
              Book Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

