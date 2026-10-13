'use client';

import { useEffect } from 'react';
import { startAppCheck } from '@/lib/appCheck';

export function AppCheckInit() {
  useEffect(() => startAppCheck(), []);
  return null;
}
