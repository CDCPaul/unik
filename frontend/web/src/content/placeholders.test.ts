import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..');
const ROOTS = [join(SRC, 'content'), join(SRC, 'app', '(site)')];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap(walk);

function scan(test: (line: string) => boolean): string[] {
  const hits: string[] = [];
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (test(line)) hits.push(`${relative(SRC, file).split(sep).join('/')}:${i + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

const BRACKET = /\[[^[\]\n]*\]/g; // 가장 안쪽 [...] 만
const CANONICAL = /^\[TBC: [^\]]+\]$/;

/** [Recap TBC], [TBA], [YEAR], [N], [... to be confirmed ...] 등 [TBC: …] 형식이 아닌 자리표시자. */
function hasLegacyPlaceholder(line: string): boolean {
  return (line.match(BRACKET) ?? []).some(
    (b) => !CANONICAL.test(b) && (/TBC|TBA|YEAR|to be confirmed/.test(b) || /to be confirmed/i.test(b) || b === '[N]'),
  );
}

describe('placeholders', () => {
  it('scans the content and (site) files', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('uses only the [TBC: …] form for placeholders', () => {
    expect(scan(hasLegacyPlaceholder)).toEqual([]);
  });

  it('detects legacy forms (self-check)', () => {
    for (const legacy of ['a [TBC]', '[TBA]', "'[YEAR]'", 'within [N] months', '[Recap TBC]', '[Policy to be confirmed.]', "['x [Recap TBC]']"]) {
      expect(hasLegacyPlaceholder(legacy), legacy).toBe(true);
    }
    for (const fine of ['[TBC: recap]', 'text-[13px]', 'a[0]']) expect(hasLegacyPlaceholder(fine), fine).toBe(false);
  });

  // 오픈 당일 점검: LAUNCH=1 pnpm --filter @unik/web test
  it.skipIf(process.env.LAUNCH !== '1')('has no [TBC: …] placeholders left (launch check)', () => {
    expect(scan((line) => /\[TBC:[^\]]*\]/.test(line))).toEqual([]);
  });
});
