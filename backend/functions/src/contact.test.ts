import { describe, expect, it } from 'vitest';
import { contactEmailHtml } from './contact';

describe('contact email escapes', () => {
  it('escapes HTML in user-provided fields', () => {
    const html = contactEmailHtml(
      { name: '<b>Maria</b>', email: 'm@example.com', subject: 'Hi', message: '<script>alert(1)</script>' },
      'doc1',
    );
    expect(html).toContain('&lt;b&gt;Maria&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});
