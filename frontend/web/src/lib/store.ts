export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** 브라우저 localStorage. 서버 렌더링 중이거나 접근이 막혀 있으면 null. */
export function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
