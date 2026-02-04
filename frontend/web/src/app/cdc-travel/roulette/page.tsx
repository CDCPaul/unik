'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Sparkles, RefreshCw, Plane } from 'lucide-react';
import { createRouletteWinner, getRouletteConfig, spinRoulette } from '@/lib/services/roulette';
import type { RouletteConfig, RouletteSlot } from '@unik/shared/types';

const Wheel = dynamic(
  () => import('react-custom-roulette').then((mod) => mod.Wheel),
  { ssr: false, loading: () => <div className="w-[520px] h-[520px]" /> }
);

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const POINTER_OFFSET_DEG = -47;

const gradeStyles: Record<string, { bg: string; text: string }> = {
  high: { bg: '#ff6b6b', text: '#1f2937' },
  mid: { bg: '#ffd166', text: '#1f2937' },
  low: { bg: '#4ecdc4', text: '#0f172a' },
};

const playWinSound = () => {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  gain.connect(ctx.destination);

  const createTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration);
  };

  createTone(523.25, 0, 0.2);
  createTone(659.25, 0.15, 0.25);
  createTone(783.99, 0.3, 0.35);
};

const buildVisualSlots = (
  tiers: Array<{ id: string; name: string; probability: number }>,
  slotCount: number,
  visualCounts?: Partial<Record<RouletteSlot['grade'], number>>,
  visualPattern?: Array<RouletteSlot['grade']>
): RouletteSlot[] => {
  const counts = tiers.reduce((acc, tier) => {
    acc[tier.id as RouletteSlot['grade']] = Math.max(0, Number(visualCounts?.[tier.id as RouletteSlot['grade']] ?? 0));
    return acc;
  }, {} as Record<RouletteSlot['grade'], number>);

  const total = Object.values(counts).reduce((acc, value) => acc + value, 0);
  if (total !== slotCount) {
    const fallbackId = (tiers[tiers.length - 1]?.id || 'low') as RouletteSlot['grade'];
    counts[fallbackId] = Math.max(0, (counts[fallbackId] || 0) + (slotCount - total));
  }

  const tierMap = tiers.reduce((acc, tier) => {
    acc[tier.id as RouletteSlot['grade']] = tier;
    return acc;
  }, {} as Record<RouletteSlot['grade'], { id: string; name: string }>);

  const pattern = (visualPattern?.length
    ? visualPattern
    : ['low', 'low', 'low', 'mid', 'high', 'mid', 'low', 'low', 'low']) as Array<RouletteSlot['grade']>;

  const slots: RouletteSlot[] = [];
  const remaining = { ...counts };
  let guard = 0;

  while (slots.length < slotCount && guard < slotCount * 5) {
    for (const id of pattern) {
      if (slots.length >= slotCount) break;
      if (remaining[id] > 0) {
        const name = tierMap[id]?.name || id;
        const nextIndex = (counts[id] - remaining[id]) + 1;
        slots.push({
          id: `${id}-${nextIndex}`,
          label: name,
          grade: id,
          probability: 0,
          total_stock: 0,
          current_stock: 0,
        });
        remaining[id] -= 1;
      }
    }
    guard += 1;
  }

  for (const id of Object.keys(remaining) as Array<RouletteSlot['grade']>) {
    while (slots.length < slotCount && remaining[id] > 0) {
      const name = tierMap[id]?.name || id;
      const nextIndex = (counts[id] - remaining[id]) + 1;
      slots.push({
        id: `${id}-${nextIndex}`,
        label: name,
        grade: id,
        probability: 0,
        total_stock: 0,
        current_stock: 0,
      });
      remaining[id] -= 1;
    }
  }

  return slots;
};

export default function CdcTravelRoulettePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [config, setConfig] = useState<RouletteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSpinningRequest, setIsSpinningRequest] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [pendingSlot, setPendingSlot] = useState<RouletteSlot | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RouletteSlot | null>(null);
  const [lastResultIndex, setLastResultIndex] = useState<number | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [winnerName, setWinnerName] = useState('');
  const [winnerContact, setWinnerContact] = useState('');
  const [isSavingWinner, setIsSavingWinner] = useState(false);
  const [winnerError, setWinnerError] = useState('');
  const [winnerSaved, setWinnerSaved] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const wheelWrapperRef = useRef<HTMLDivElement | null>(null);
  const dragAngleRef = useRef<number | null>(null);
  const [dragRotation, setDragRotation] = useState(0);

  useEffect(() => {
    const updateScale = () => {
      const nextScale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
      setScale(Number.isFinite(nextScale) ? nextScale : 1);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getPrizeLabel = (slot?: RouletteSlot | null) => {
    if (!slot) return '';
    const tierName = config?.tiers?.find((tier) => tier.id === slot.grade)?.name;
    return tierName || slot.label;
  };

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreen);
    updateFullscreen();
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getRouletteConfig();
        setConfig(data);
      } catch (error) {
        console.error('Failed to load roulette config:', error);
        setErrorMessage('룰렛 데이터를 불러오지 못했어요.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const rouletteSlots = useMemo(() => {
    if (config?.tiers?.length) {
      return buildVisualSlots(
        config.tiers,
        config.slotCount || 50,
        config.visualCounts,
        config.visualPattern
      );
    }
    return config?.slots || [];
  }, [config?.slotCount, config?.slots, config?.tiers, config?.visualCounts, config?.visualPattern]);

  const wheelData = useMemo(() => {
    return rouletteSlots.map(slot => {
      const style = gradeStyles[slot.grade] || gradeStyles.low;
      return {
        option: slot.label,
        style: {
          backgroundColor: style.bg,
          textColor: style.text,
        },
      };
    });
  }, [rouletteSlots]);

  const safeWheelData = wheelData.length
    ? wheelData
    : [{ option: 'Loading', style: { backgroundColor: '#e2e8f0', textColor: '#94a3b8' } }];

  const hasRemaining = useMemo(() => rouletteSlots.length > 0, [rouletteSlots]);

  const requestFullscreen = async () => {
    if (!containerRef.current || document.fullscreenElement) return;
    try {
      await containerRef.current.requestFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  const handleSpin = async () => {
    if (isSpinning || isSpinningRequest || !hasRemaining || !config) return;
    setErrorMessage('');
    setWinnerError('');
    setWinnerSaved(false);
    setIsSpinningRequest(true);
    try {
      const result = await spinRoulette(config.id);
      const nextIndex = Math.max(0, Math.min(result.index, rouletteSlots.length - 1));
      setPrizeNumber(nextIndex);
      setPendingSlot(result.slot);
      setPendingIndex(nextIndex);
      setDragRotation(0);
      setIsSpinning(true);
      setConfig(prev => {
        if (!prev?.slots?.length) return prev;
        return {
          ...prev,
          slots: prev.slots.map((slot, idx) =>
            idx === nextIndex ? { ...slot, current_stock: result.remainingStock } : slot
          ),
        };
      });
    } catch (error) {
      console.error('Spin failed:', error);
      setErrorMessage('스핀 요청에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSpinningRequest(false);
    }
  };

  const handleSaveWinner = async () => {
    if (!lastResult || !config || !winnerName.trim() || !winnerContact.trim()) return;
    setIsSavingWinner(true);
    setWinnerError('');
    try {
      await createRouletteWinner({
        rouletteId: config.id,
        winnerName: winnerName.trim(),
        winnerContact: winnerContact.trim(),
        slot: lastResult,
        slotIndex: lastResultIndex ?? undefined,
      });
      setWinnerSaved(true);
    } catch (error) {
      console.error('Failed to save winner:', error);
      setWinnerError('Failed to save. Please try again.');
    } finally {
      setIsSavingWinner(false);
    }
  };

  const getWheelCenter = () => {
    const rect = wheelWrapperRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const getAngle = (center: { x: number; y: number }, point: { x: number; y: number }) => {
    return Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
  };

  const normalizeDelta = (delta: number) => {
    if (delta > 180) return delta - 360;
    if (delta < -180) return delta + 360;
    return delta;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSpinning || isSpinningRequest) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragMovedRef.current = false;
    const center = getWheelCenter();
    if (center) {
      dragAngleRef.current = getAngle(center, { x: event.clientX, y: event.clientY });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const center = getWheelCenter();
    if (!center || dragAngleRef.current === null) return;
    const nextAngle = getAngle(center, { x: event.clientX, y: event.clientY });
    const delta = normalizeDelta(nextAngle - dragAngleRef.current);
    if (Math.abs(delta) > 1) {
      dragMovedRef.current = true;
    }
    dragAngleRef.current = nextAngle;
    setDragRotation(prev => prev + delta);
  };

  const handlePointerUp = () => {
    if (dragMovedRef.current) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      handleSpin();
    } else {
      setDragRotation(0);
    }
    dragStartRef.current = null;
    dragMovedRef.current = false;
    dragAngleRef.current = null;
  };

  const targetSpins = config?.targetSpins || 0;

  return (
    <div ref={containerRef} className="w-screen h-screen bg-[#f9fafb] overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="relative"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          <div className="absolute inset-0 rounded-[48px] bg-linear-to-br from-[#d6f4ff] via-[#fff7d1] to-[#ffe4e6] shadow-[0_40px_120px_rgba(15,23,42,0.15)] border border-white/60" />
          <div className="relative h-full p-10 flex flex-col">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm tracking-[0.3em] text-slate-500">CDC TRAVEL</p>
                <h1 className="text-5xl font-bold text-slate-900 mt-2">Festival Roulette</h1>
                <p className="text-lg text-slate-600 mt-2">
                  Tap the wheel to win your prize 🎉
                </p>
              </div>
              <button
                onClick={isFullscreen ? exitFullscreen : requestFullscreen}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-slate-700 shadow-sm hover:bg-white transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </header>

            <div className="flex-1 grid grid-cols-[1.7fr_0.7fr] gap-8 items-center">
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative"
                  onClick={() => {
                    if (suppressClickRef.current) return;
                    handleSpin();
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  role="button"
                  aria-label="Spin roulette"
                  style={{ touchAction: 'manipulation', transform: 'scale(2)', transformOrigin: 'center' }}
                >
                  <div className="absolute -inset-6 rounded-full bg-white/60 blur-2xl" />
                  <div className="pointer-events-none absolute left-1/2 top-[-44px] z-10 flex -translate-x-1/2 flex-col items-center">
                    <div className="h-10 w-1 rounded-full bg-linear-to-b from-amber-300 via-amber-400 to-amber-500 shadow-md" />
                    <div className="-mt-1 h-5 w-5 rotate-45 rounded-sm bg-white shadow-lg ring-2 ring-amber-300" />
                    <div className="-mt-2 h-3 w-3 rotate-45 rounded-sm bg-amber-400 shadow-sm" />
                    <Plane
                      className={`mt-2 h-6 w-6 text-amber-500 drop-shadow ${
                        lastResult ? 'animate-pulse' : ''
                      }`}
                    />
                    {lastResult && (
                      <div className="mt-2 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-lg">
                        Winner
                      </div>
                    )}
                  </div>
                  <div
                    ref={wheelWrapperRef}
                    className="transition-transform duration-150"
                    style={{
                      transform: isSpinning
                        ? `rotate(${POINTER_OFFSET_DEG}deg)`
                        : `rotate(${dragRotation + POINTER_OFFSET_DEG}deg)`,
                    }}
                  >
                    <Wheel
                      mustStartSpinning={isSpinning}
                      prizeNumber={prizeNumber}
                      data={safeWheelData}
                      pointerProps={{ style: { display: 'none' } }}
                      onStopSpinning={() => {
                        setIsSpinning(false);
                        setLastResult(pendingSlot);
                      setLastResultIndex(pendingIndex);
                        setPendingSlot(null);
                      setPendingIndex(null);
                      setWinnerName('');
                      setWinnerContact('');
                      setWinnerSaved(false);
                      setWinnerError('');
                        setShowWin(true);
                        playWinSound();
                      }}
                      fontSize={12}
                      outerBorderColor="#ffffff"
                      outerBorderWidth={10}
                      innerBorderColor="#fef3c7"
                      innerBorderWidth={24}
                      radiusLineColor="#ffffff"
                      radiusLineWidth={1}
                      textDistance={60}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <span className="text-lg font-semibold text-slate-700">
                        {isSpinningRequest ? 'Loading...' : 'SPIN'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  {hasRemaining ? 'Touch the wheel to start' : 'All prizes are out of stock'}
                </p>
                {errorMessage && (
                  <p className="mt-2 text-sm text-rose-500">{errorMessage}</p>
                )}
              </div>

              <div className="space-y-4 max-w-[420px] justify-self-end scale-[1.5] origin-top-right">
                <div className="rounded-3xl bg-white/80 border border-white shadow-sm p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Last Result</p>
                  <p className="text-2xl font-semibold text-slate-900 mt-2">
                    {isSpinning || isSpinningRequest
                      ? 'Spinning...'
                      : lastResult
                        ? getPrizeLabel(lastResult)
                        : 'Ready to play'}
                  </p>
                </div>

                <div className="rounded-3xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                  <p className="font-medium text-slate-800 mb-2">How to Join</p>
                  <ul className="space-y-1">
                    <li>• Roulette chances are for guests who book the Cebu Travel Catalogue International 2026.</li>
                    <li>• Prizes are claimed at the airport on the day of departure.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-[48px]">
              <div className="flex items-center gap-3 text-slate-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading roulette data...
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showWin && lastResult && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="relative w-[520px] rounded-3xl bg-white p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-linear-to-br from-amber-300 to-rose-300 rounded-full opacity-70 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-linear-to-br from-sky-300 to-emerald-200 rounded-full opacity-60 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 text-amber-500">
                  <Sparkles className="w-6 h-6" />
                  <span className="uppercase tracking-[0.2em] text-xs">Winner</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mt-3">
                  {getPrizeLabel(lastResult)}
                </h2>

                <div className="mt-6 space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-slate-500">Name</label>
                    <input
                      type="text"
                      value={winnerName}
                      onChange={(e) => setWinnerName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Enter name"
                      disabled={winnerSaved}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-slate-500">Contact</label>
                    <input
                      type="text"
                      value={winnerContact}
                      onChange={(e) => setWinnerContact(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="Enter contact"
                      disabled={winnerSaved}
                    />
                  </div>
                  {winnerError && <p className="text-sm text-rose-500">{winnerError}</p>}
                  {winnerSaved && (
                    <p className="text-sm text-emerald-600">Saved successfully!</p>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowWin(false)}
                    className="w-full py-3 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveWinner}
                    disabled={isSavingWinner || winnerSaved || !winnerName.trim() || !winnerContact.trim()}
                    className="w-full py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingWinner ? 'Saving...' : winnerSaved ? 'Saved' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
