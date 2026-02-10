import { NextResponse } from 'next/server';
import { firebaseConfig } from '@unik/shared/firebase/config';

const resolveWinnerEndpoint = () => {
  const projectId = firebaseConfig.projectId;
  const explicitWinnerUrl = process.env.NEXT_PUBLIC_CREATE_WINNER_URL;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  
  if (explicitWinnerUrl) return explicitWinnerUrl;
  if (explicitBase) return `${explicitBase.replace(/\/$/, '')}/createRouletteWinner`;
  
  // Production: use Cloud Run URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://createroulettewinner-6b6i7iageq-du.a.run.app';
  }
  
  // Development: use local emulator
  return `http://127.0.0.1:5001/${projectId}/asia-northeast3/createRouletteWinner`;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const endpoint = resolveWinnerEndpoint();

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
    console.error('Winner endpoint error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to winner service' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
