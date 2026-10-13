// 로컬 E2E 전용: NEXT_PUBLIC_USE_AUTH_EMULATOR=true 일 때 Auth 를 에뮬레이터에 연결한다.
// lib/firebase.ts(명함 보호)는 건드리지 않고, 어드민 진입 모듈에서 부작용 import 로 쓴다.
import { connectAuthEmulator } from 'firebase/auth';
import { auth } from '@/lib/firebase';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
  const w = window as Window & { __authEmulatorConnected?: boolean };
  if (!w.__authEmulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    w.__authEmulatorConnected = true;
  }
}

export {};
