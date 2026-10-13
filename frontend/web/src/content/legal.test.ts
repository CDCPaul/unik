import { describe, expect, it } from 'vitest';
import { LEGAL } from './legal';

describe('privacy policy', () => {
  const text = JSON.stringify(LEGAL.privacy.sections);
  it('discloses the on-device draft and its 14-day limit', () => {
    expect(text).toMatch(/saved on your own device/);
    expect(text).toMatch(/14 days/);
  });
  it('discloses reCAPTCHA / App Check', () => {
    expect(text).toMatch(/reCAPTCHA/);
    expect(text).toMatch(/App Check/);
  });
});
