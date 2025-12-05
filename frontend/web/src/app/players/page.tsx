'use client';

import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, Users } from 'lucide-react';

// Placeholder data - will be replaced with Firestore data
const players = [
  { id: 1, name: 'Player 1', team: 'Team A', position: 'Guard', number: 7 },
  { id: 2, name: 'Player 2', team: 'Team B', position: 'Forward', number: 23 },
  { id: 3, name: 'Player 3', team: 'Team C', position: 'Center', number: 15 },
  { id: 4, name: 'Player 4', team: 'Team D', position: 'Guard', number: 11 },
  { id: 5, name: 'Player 5', team: 'Team E', position: 'Forward', number: 34 },
  { id: 6, name: 'Player 6', team: 'Team F', position: 'Center', number: 44 },
  { id: 7, name: 'Player 7', team: 'Team G', position: 'Guard', number: 3 },
  { id: 8, name: 'Player 8', team: 'Team H', position: 'Forward', number: 21 },
  { id: 9, name: 'Player 9', team: 'Team I', position: 'Center', number: 55 },
  { id: 10, name: 'Player 10', team: 'Team J', position: 'Guard', number: 10 },
];

export default function PlayersPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-900" />
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
              10 elite Filipino basketball players competing in the Korean Basketball League.
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
              <span className="text-white font-semibold">10 Filipino Imports</span>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="card overflow-hidden hover:border-gold-500/30 transition-all duration-500">
                  {/* Player Image Placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-dark-700 to-dark-800 
                                 relative overflow-hidden">
                    {/* Jersey Number */}
                    <div className="absolute top-4 right-4 text-6xl font-display font-bold 
                                   text-dark-600/50 group-hover:text-gold-500/30 transition-colors">
                      #{player.number}
                    </div>
                    
                    {/* Placeholder Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-dark-600/50 flex items-center justify-center">
                        <Star className="w-10 h-10 text-gold-500/40" />
                      </div>
                    </div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
                    
                    {/* Player Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-gold-400 text-sm font-medium uppercase tracking-wider">
                        {player.position}
                      </div>
                      <h3 className="text-white text-xl font-semibold mt-1">
                        {player.name}
                      </h3>
                      <p className="text-dark-400 text-sm mt-1">{player.team}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-16 bg-dark-950 border-t border-dark-800">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                           bg-gold-500/10 border border-gold-500/30 mb-6">
              <Star className="w-8 h-8 text-gold-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Full Player Profiles Coming Soon
            </h3>
            <p className="text-dark-400">
              We&apos;re preparing detailed profiles for each player including stats, 
              highlights, and exclusive content. Stay tuned!
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

