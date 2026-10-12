// shared/domain 의 순수 TS 모듈을 functions/src/shared-domain 으로 복사한다.
// Firebase 배포는 backend/functions 디렉터리만 올리므로 워크스페이스 패키지를 직접 참조할 수 없다.
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', '..', 'shared', 'domain');
const dest = join(here, '..', 'src', 'shared-domain');

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
for (const file of files) cpSync(join(src, file), join(dest, file));
console.log(`copy-shared: ${files.length} files -> src/shared-domain`);
