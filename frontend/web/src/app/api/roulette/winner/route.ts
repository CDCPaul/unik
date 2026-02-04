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
  
  // Development: use local emulator or Cloud Functions
  return `https://asia-northeast3-${projectId}.cloudfunctions.net/createRouletteWinner`;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const endpoint = resolveWinnerEndpoint();

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
}
