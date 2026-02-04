import { NextResponse } from 'next/server';
import { firebaseConfig } from '@unik/shared/firebase/config';

const resolveSpinEndpoint = () => {
  const projectId = firebaseConfig.projectId;
  const explicitSpinUrl = process.env.NEXT_PUBLIC_SPIN_ROULETTE_URL;
  const explicitBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL;
  if (explicitSpinUrl) return explicitSpinUrl;
  if (explicitBase) return `${explicitBase.replace(/\/$/, '')}/spinRoulette`;
  return `https://asia-northeast3-${projectId}.cloudfunctions.net/spinRoulette`;
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const endpoint = resolveSpinEndpoint();

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
