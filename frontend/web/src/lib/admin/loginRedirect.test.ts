import { describe, expect, it } from 'vitest';
import { loginUrlFor, safeNextPath } from './loginRedirect';

describe('loginUrlFor', () => {
  it('carries the current path and query as an encoded next parameter', () => {
    expect(loginUrlFor('/admin/applicants', '?id=abc&q=x y')).toBe('/admin/login?next=%2Fadmin%2Fapplicants%3Fid%3Dabc%26q%3Dx%20y');
    expect(loginUrlFor('/admin/promo-codes', '')).toBe('/admin/login?next=%2Fadmin%2Fpromo-codes');
  });
});

describe('safeNextPath', () => {
  it('accepts only same-site /admin paths', () => {
    expect(safeNextPath('/admin/applicants?id=1')).toBe('/admin/applicants?id=1');
    expect(safeNextPath('/admin')).toBe('/admin');
  });
  it('falls back to /admin for anything else', () => {
    for (const bad of [null, '', '/', '/other', 'https://evil.example/admin', '//evil.example/admin', '/admin/../x', '/administrator', 'admin']) {
      expect(safeNextPath(bad)).toBe('/admin');
    }
  });
  it('does not loop back to the login page', () => {
    expect(safeNextPath('/admin/login')).toBe('/admin');
    expect(safeNextPath('/admin/login?next=/admin')).toBe('/admin');
  });
});
