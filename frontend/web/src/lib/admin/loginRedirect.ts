/** 로그인 후 돌아올 경로를 안전하게 고른다: /admin 아래의 같은 사이트 경로만 허용한다. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !/^\/admin(?:[/?#]|$)/.test(next)) return '/admin';
  if (next.includes('\\') || next.split(/[?#]/)[0].split('/').includes('..')) return '/admin';
  if (/^\/admin\/login(?:[/?#]|$)/.test(next)) return '/admin';
  return next;
}

/** 로그인되지 않은 채 연 주소(경로+쿼리)를 next 로 담은 로그인 주소 */
export function loginUrlFor(pathname: string, search: string): string {
  return `/admin/login?next=${encodeURIComponent(`${pathname}${search}`)}`;
}
