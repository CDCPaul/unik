import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SITE = resolve(__dirname, 'app', '(site)');
// 결과 페이지는 noindex 이므로 canonical 을 두지 않는다.
const NOINDEX = new Set(['/apply/thanks']);

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pages(full);
    return name === 'page.tsx' ? [full] : [];
  });
}

function routeOf(file: string): string {
  const dir = relative(SITE, join(file, '..')).split(sep).join('/');
  return dir ? `/${dir}` : '/';
}

describe('canonical URLs', () => {
  const all = pages(SITE).map((file) => ({ route: routeOf(file), source: readFileSync(file, 'utf8') }));

  it('finds the public pages', () => {
    expect(all.map((p) => p.route)).toEqual(expect.arrayContaining(['/', '/tour', '/apply', '/privacy']));
  });

  it.each(all.filter((p) => !NOINDEX.has(p.route)))('$route declares its own canonical path', ({ route, source }) => {
    expect(source).toContain(`alternates: { canonical: '${route}' }`);
  });

  it('keeps noindex pages without a canonical', () => {
    for (const p of all.filter((x) => NOINDEX.has(x.route))) expect(p.source).not.toContain('canonical');
  });
});
