import { NextResponse } from 'next/server';
import { firebaseConfig } from '@unik/shared/firebase/config';

const resolveSpinEndpoint = () => {
  const projectId = firebaseConfig.projectId;
  const explicitSpinUrl = process.env.NEXT_PUBLIC_SPIN_ROULETTE_URL;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  
  if (explicitSpinUrl) return explicitSpinUrl;
  if (explicitBase) return `${explicitBase.replace(/\/$/, '')}/spinRoulette`;
  
  // Production: use Cloud Run URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://spinroulette-6b6i7iageq-du.a.run.app';
  }
  
  // Development: use local emulator
  return `http://127.0.0.1:5001/${projectId}/asia-northeast3/spinRoulette`;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const endpoint = resolveSpinEndpoint();

  // 웜업 요청인 경우 빠르게 응답 (실제 스핀 안함)
  if (payload.warmup === true) {
    try {
      // 백엔드에 웜업 요청만 보내고 응답 기다리지 않음
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, warmup: true }),
      }).catch(() => {});
      
      return new NextResponse(
        JSON.stringify({ warmup: true }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch {
      return new NextResponse(
        JSON.stringify({ warmup: true }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const bodyText = await response.text();
    return new NextResponse(bodyText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Spin endpoint error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to spin service' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
