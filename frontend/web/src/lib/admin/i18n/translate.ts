import { en } from './en';
import type { MessageKey } from './en';
import { ko } from './ko';

export type { MessageKey } from './en';

export type Locale = 'en' | 'ko';
export const LOCALES: readonly Locale[] = ['en', 'ko'];
export const DEFAULT_LOCALE: Locale = 'en';

export const DICTIONARIES: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = { en, ko };

export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'ko';

/**
 * 화면에 보여줄 문구를 키(+값)로 표현한다. lib/admin 의 순수 함수는 문자열 대신 이것을 돌려주고,
 * UI 가 현재 언어로 번역한다. 값에 Msg 를 넣으면 같은 언어로 함께 번역되고, Msg 배열은 ", " 로 잇는다.
 */
export interface Msg {
  readonly key: MessageKey;
  readonly params?: MsgParams;
}
export type MsgParam = string | number | Msg | readonly Msg[];
export type MsgParams = Readonly<Record<string, MsgParam>>;

export function msg(key: MessageKey, params?: MsgParams): Msg {
  return params ? { key, params } : { key };
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** 문구 안의 {name} 자리표시자 이름 (중복 제거, 정렬) */
export function placeholders(template: string): string[] {
  return [...new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1]))].sort();
}

function paramText(locale: Locale, v: MsgParam): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v); // 숫자 형식은 언어와 무관하게 그대로
  if (Array.isArray(v)) return (v as readonly Msg[]).map((m) => translate(locale, m)).join(', ');
  return translate(locale, v as Msg);
}

/** 키(또는 Msg)를 locale 문구로. 넘기지 않은 자리표시자는 {name} 그대로 둔다. */
export function translate(locale: Locale, keyOrMsg: MessageKey | Msg, params?: MsgParams): string {
  const m: Msg = typeof keyOrMsg === 'string' ? { key: keyOrMsg, params } : keyOrMsg;
  const template = DICTIONARIES[locale][m.key] ?? en[m.key] ?? m.key;
  const p = m.params;
  if (!p) return template;
  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const v = p[name];
    return v === undefined ? whole : paramText(locale, v);
  });
}

export interface TFunction {
  (key: MessageKey, params?: MsgParams): string;
  (m: Msg): string;
}

export function makeT(locale: Locale): TFunction {
  return ((k: MessageKey | Msg, p?: MsgParams) => translate(locale, k, p)) as TFunction;
}

/** Msg 를 담아 던지는 오류 (트랜잭션 안의 계산 오류를 UI 까지 번역 가능한 형태로 전달). message 는 영어 문구. */
export class MessageError extends Error {
  readonly msg: Msg;
  constructor(m: Msg) {
    super(translate('en', m));
    this.name = 'MessageError';
    this.msg = m;
  }
}
