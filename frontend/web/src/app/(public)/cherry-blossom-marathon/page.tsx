'use client';

import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export default function CherryBlossomMarathonPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-32">
      <div className="container-custom text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Construction className="w-24 h-24 mx-auto mb-8 text-gold-500 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Cherry Blossom Marathon
          </h1>
          <p className="text-xl text-dark-400 mb-8">
            Coming Soon
          </p>
          <div className="inline-block px-6 py-3 bg-dark-800 rounded-lg border border-dark-700">
            <p className="text-dark-300">
              🌸 This page is currently under development
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

