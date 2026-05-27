/**
 * vCard 3.0 생성기.
 *
 * - VERSION:3.0 은 UTF-8 을 기본 인코딩으로 가정하므로 별도 CHARSET 파라미터를 붙이지 않음.
 *   (CHARSET=UTF-8 을 추가하면 오히려 iOS 일부 버전에서 한글이 깨질 수 있음)
 * - 텍스트 값의 특수문자(`\`, `;`, `,`, 개행)는 RFC 6350 §3.4 규칙으로 이스케이프.
 * - 한 줄이 75 octet 을 초과하면 CRLF + SP 로 폴딩(특히 base64 PHOTO).
 * - 모든 줄 구분자는 CRLF(\r\n) — iOS 연락처가 LF 단독을 무시하는 케이스가 있음.
 */

export interface VCardInput {
  fullName: string;             // 필수. FN 필드 (전체 표시 이름)
  familyName?: string;          // N 필드의 성
  givenName?: string;           // N 필드의 이름
  organization?: string;        // ORG 첫 번째 컴포넌트 (회사명)
  department?: string;          // ORG 두 번째 컴포넌트 (부서)
  title?: string;               // TITLE (직함)
  phoneCell?: string;           // TEL;TYPE=CELL
  phoneWork?: string;           // TEL;TYPE=WORK
  email?: string;               // EMAIL;TYPE=WORK
  workAddress?: string;         // ADR;TYPE=WORK 의 street/extended 부분
  website?: string;             // URL
  /** raw base64 (no `data:` prefix). 함께 photoMimeType 지정 권장. */
  photoBase64?: string;
  /** "image/jpeg" | "image/png" 등. 미지정 시 JPEG 로 간주. */
  photoMimeType?: string;
}

/** RFC 6350 §3.4 텍스트 값 이스케이프. 백슬래시 → 세미콜론 → 콤마 → 개행 순서 중요. */
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * 75 옥텟(UTF-8 바이트 기준) 초과 시 RFC 6350 §3.2 라인 폴딩.
 * Base64 PHOTO 값을 위해 안전하게 자른다. 한글이 섞인 일반 라인도 octet 기준으로 처리.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let offset = 0;
  let limit = 75;
  while (offset < bytes.length) {
    let end = Math.min(offset + limit, bytes.length);
    // UTF-8 멀티바이트 문자 경계 보존: 마지막 바이트가 연속 바이트(10xxxxxx)면 뒤로 끌어옴
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(decoder.decode(bytes.slice(offset, end)));
    offset = end;
    limit = 74; // 후속 라인은 선행 SP 1바이트가 붙으므로 74 만 채움
  }
  return chunks.join('\r\n ');
}

/**
 * "홍길동" / "John Doe" 같은 입력에서 (성, 이름)을 추정.
 * 한글: 첫 글자 = 성, 나머지 = 이름. 영문: 마지막 단어 = 성, 나머지 = 이름.
 */
export function splitName(full: string): { family: string; given: string } {
  const trimmed = full.trim();
  if (!trimmed) return { family: '', given: '' };
  const isHangul = /[ㄱ-힝]/.test(trimmed);
  if (isHangul && /^[ㄱ-힝]+$/.test(trimmed)) {
    return { family: trimmed.slice(0, 1), given: trimmed.slice(1) };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { family: '', given: parts[0] };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
}

export function buildVCard(input: VCardInput): string {
  const lines: string[] = [];

  const family = input.familyName ?? '';
  const given = input.givenName ?? '';
  const needsAutoSplit = !family && !given;
  const auto = needsAutoSplit ? splitName(input.fullName) : { family, given };

  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  lines.push(`PRODID:-//Cebu Direct Club//Mobile Business Card//KO`);
  lines.push(`N:${escapeValue(auto.family)};${escapeValue(auto.given)};;;`);
  lines.push(`FN:${escapeValue(input.fullName)}`);

  if (input.organization || input.department) {
    const org = escapeValue(input.organization ?? '');
    const dept = escapeValue(input.department ?? '');
    lines.push(`ORG:${org};${dept}`);
  }
  if (input.title) lines.push(`TITLE:${escapeValue(input.title)}`);
  if (input.phoneCell) lines.push(`TEL;TYPE=CELL,VOICE:${input.phoneCell}`);
  if (input.phoneWork) lines.push(`TEL;TYPE=WORK,VOICE:${input.phoneWork}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${input.email}`);
  if (input.workAddress) {
    // ADR 컴포넌트: PO Box ; Extended ; Street ; City ; Region ; Postal ; Country
    // 한 줄 주소를 Street 칸에 넣어 전체가 한 덩어리로 표시되게 함.
    lines.push(`ADR;TYPE=WORK:;;${escapeValue(input.workAddress)};;;;`);
  }
  if (input.website) lines.push(`URL:${input.website}`);

  if (input.photoBase64) {
    const mime = input.photoMimeType ?? 'image/jpeg';
    const subtype = mime.split('/')[1]?.toUpperCase() ?? 'JPEG';
    lines.push(`PHOTO;ENCODING=b;TYPE=${subtype}:${input.photoBase64}`);
  }

  lines.push('REV:' + new Date().toISOString());
  lines.push('END:VCARD');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
