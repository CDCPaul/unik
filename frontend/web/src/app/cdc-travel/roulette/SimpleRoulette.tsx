'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { RouletteSlot } from '@unik/shared/types';

interface SimpleRouletteProps {
  slots: RouletteSlot[];
  onSpin: () => void;
  isSpinning: boolean;
  isSpinningRequest: boolean;
  prizeIndex: number | null;
  gradeStyles: Record<string, { bg: string; text: string }>;
}

export default function SimpleRoulette({
  slots,
  onSpin,
  isSpinning,
  isSpinningRequest,
  prizeIndex,
  gradeStyles,
}: SimpleRouletteProps) {
  const [showResult, setShowResult] = useState(false);

  const handleSpin = () => {
    setShowResult(false);
    onSpin();
    // Show result after animation
    setTimeout(() => setShowResult(true), 3000);
  };

  const prizeSlot = prizeIndex !== null ? slots[prizeIndex] : null;
  const style = prizeSlot ? gradeStyles[prizeSlot.grade] || gradeStyles.low : gradeStyles.low;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 space-y-8">
      {/* Simple Wheel Display */}
      <div className="relative w-full max-w-md aspect-square">
        <motion.div
          className="absolute inset-0 rounded-full border-8 border-white shadow-2xl overflow-hidden"
          animate={
            isSpinning
              ? {
                  rotate: [0, 360 * 3],
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={{
            duration: 3,
            ease: [0.43, 0.13, 0.23, 0.96],
          }}
          style={{
            background: `conic-gradient(
              ${slots
                .map((slot, idx) => {
                  const s = gradeStyles[slot.grade] || gradeStyles.low;
                  const start = (idx / slots.length) * 100;
                  const end = ((idx + 1) / slots.length) * 100;
                  return `${s.bg} ${start}%, ${s.bg} ${end}%`;
                })
                .join(', ')}
            )`,
          }}
        >
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </motion.div>

        {/* Pointer */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '40px solid #ef4444',
          }}
        />
      </div>

      {/* Result Display */}
      {showResult && prizeSlot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 p-8 rounded-2xl"
          style={{
            backgroundColor: style.bg,
            color: style.text,
          }}
        >
          <h2 className="text-3xl font-bold">🎉 축하합니다!</h2>
          <p className="text-5xl font-bold">{prizeSlot.label}</p>
        </motion.div>
      )}

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || isSpinningRequest || slots.length === 0}
        className="px-12 py-6 text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
      >
        {isSpinning || isSpinningRequest ? '돌리는 중...' : 'SPIN!'}
      </button>

      {/* Slot Count */}
      <p className="text-white/80 text-lg">
        총 {slots.length}개 슬롯
      </p>
    </div>
  );
}
