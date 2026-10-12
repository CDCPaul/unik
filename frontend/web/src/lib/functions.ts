import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import app from '@/lib/firebase';

export const functions = getFunctions(app, 'asia-northeast3');

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
  const w = window as Window & { __functionsEmulatorConnected?: boolean };
  if (!w.__functionsEmulatorConnected) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    w.__functionsEmulatorConnected = true;
  }
}
