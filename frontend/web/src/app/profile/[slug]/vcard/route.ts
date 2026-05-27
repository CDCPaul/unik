import { NextRequest } from 'next/server';
import { getBusinessCardBySlug } from '@/lib/services/businessCards';
import { buildVCard } from '@/lib/vcard';
import { COMPANY_INFO } from '@/lib/businessCardConfig';

/**
 * GET /profile/{slug}/vcard
 *
 * 서버 사이드에서 .vcf 파일을 직접 응답한다.
 * - 클라이언트 Blob 다운로드와 달리 iOS Safari 가 100% Content-Type 으로 파일을 인식
 *   → "연락처에 추가" UI 가 바로 뜸.
 * - Content-Disposition 의 filename* (RFC 5987) 로 한글 이름도 깨지지 않게 처리.
 * - 사진은 base64 로 임베드해 .vcf 단독으로도 사진이 따라오게 함.
 */

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const card = await getBusinessCardBySlug(slug);

  if (!card) {
    return new Response('Business card not found', { status: 404 });
  }

  // 사진을 base64 로 임베드 (실패해도 vCard 자체는 발행)
  let photoBase64: string | undefined;
  let photoMime: string | undefined;
  if (card.photoUrl) {
    try {
      const res = await fetch(card.photoUrl, { cache: 'no-store' });
      if (res.ok) {
        const ct = res.headers.get('content-type') ?? 'image/jpeg';
        if (ct.startsWith('image/')) {
          photoMime = ct.split(';')[0].trim();
          const buf = await res.arrayBuffer();
          photoBase64 = Buffer.from(buf).toString('base64');
        }
      }
    } catch (error) {
      console.warn('Failed to fetch photo for vCard:', error);
    }
  }

  const vcard = buildVCard({
    fullName: card.name,
    familyName: card.familyName,
    givenName: card.givenName,
    organization: COMPANY_INFO.name,
    department: card.department,
    title: card.title,
    // 기존 저장 데이터에 하이픈이 남아 있을 수 있어 방어적으로 제거 (스페이스는 vCard TEL 에서 유효)
    phoneCell: card.phone.replace(/-/g, ' ').replace(/\s+/g, ' ').trim(),
    phoneWork: COMPANY_INFO.officePhone,
    email: card.email,
    workAddress: COMPANY_INFO.address,
    website: COMPANY_INFO.website,
    photoBase64,
    photoMimeType: photoMime,
  });

  // 파일명: 영문 slug 는 안전한 ASCII fallback, 사용자에게 보이는 이름은 UTF-8 인코딩으로
  const asciiName = `${card.slug}.vcf`;
  const utf8Name = `${card.name}.vcf`;
  const contentDisposition =
    `attachment; filename="${asciiName}"; ` +
    `filename*=UTF-8''${encodeURIComponent(utf8Name)}`;

  // UTF-8 바이트 길이를 정확히 계산해 Content-Length 헤더에 사용
  const body = new TextEncoder().encode(vcard);

  return new Response(body, {
    status: 200,
    headers: {
      // text/vcard 가 RFC 6350 공식. iOS 구버전 호환을 위해 charset 명시.
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': contentDisposition,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
