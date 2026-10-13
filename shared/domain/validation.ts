// 신청 폼 입력 규칙. 웹 폼과 Cloud Functions 가 같은 규칙을 쓴다.

export const NAME_MAX = 60;
export const PASSPORT_NAME_MAX = 80;
export const PHONE_DIAL_PATTERN = /^\+\d{1,4}$/;
export const PHONE_NUMBER_PATTERN = /^[0-9 -]{6,20}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ASCII 제어문자(U+0000–U+001F, U+007F): 메일 헤더·본문 주입 방지
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
// 자유 서술칸은 탭·줄바꿈만 허용
const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const LINK_OR_MARKUP = /[<>]|:\/\/|www\./i;

export function hasControlChars(value: string): boolean {
  return CONTROL_CHARS.test(value);
}

export function hasControlCharsExceptWhitespace(value: string): boolean {
  return CONTROL_CHARS_EXCEPT_WHITESPACE.test(value);
}

export function hasLinkOrMarkup(value: string): boolean {
  return LINK_OR_MARKUP.test(value);
}

export function isValidName(value: string): boolean {
  const v = value.trim();
  return v.length >= 1 && v.length <= NAME_MAX && !hasControlChars(v) && !hasLinkOrMarkup(v);
}

/** 여권 이름(선택 입력): 트림 후 1–80자, 제어문자·링크·마크업 금지. 쉼표·마침표 등은 허용한다. */
export function isValidPassportName(value: string): boolean {
  const v = value.trim();
  return v.length >= 1 && v.length <= PASSPORT_NAME_MAX && !hasControlChars(v) && !hasLinkOrMarkup(v);
}

/** 괄호·점을 공백으로 바꾸고 연속 공백을 하나로 줄인다. "(0917) 123-4567" → "0917 123-4567" */
export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[().]/g, ' ').replace(/\s+/g, ' ').replace(/\s+-/g, '-').trim();
}

/** 실제 달력 날짜이며 1900-01-01 ~ today(YYYY-MM-DD) 범위인가 */
export function isValidBirthDate(value: string, today: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return false;
  return value >= '1900-01-01' && value <= today;
}
