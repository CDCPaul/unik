import { describe, expect, it } from 'vitest';
import { internationalDigits, mayaPaymentLink, viberLink, whatsappLink } from './contact';

describe('internationalDigits', () => {
  it('drops the trunk 0 and formatting', () => {
    expect(internationalDigits('+63', '0917 123 4567')).toBe('639171234567');
    expect(internationalDigits('+63', '917-123-4567')).toBe('639171234567');
    expect(internationalDigits('+82', '010-1234-5678')).toBe('821012345678');
  });
  it('does not duplicate a country code typed into the number', () => {
    expect(internationalDigits('+63', '+63 917 123 4567')).toBe('639171234567');
    expect(internationalDigits('+63', '639171234567')).toBe('639171234567');
  });
  it('returns null for unusable input', () => {
    expect(internationalDigits('', '9171234567')).toBeNull();
    expect(internationalDigits('+63', '123')).toBeNull();
  });
});

describe('chat links', () => {
  it('builds WhatsApp and Viber links', () => {
    expect(whatsappLink('+63', '0917 123 4567')).toBe('https://wa.me/639171234567');
    expect(viberLink('+63', '0917 123 4567')).toBe('viber://chat?number=%2B639171234567');
    expect(whatsappLink('+63', '12')).toBeNull();
  });
});

describe('mayaPaymentLink', () => {
  it('appends or replaces the amount', () => {
    expect(mayaPaymentLink('https://mymaya.me/cdctravel', 30000)).toBe('https://mymaya.me/cdctravel?amt=30000');
    expect(mayaPaymentLink('https://mymaya.me/cdctravel?amt=1&x=y', 500)).toBe('https://mymaya.me/cdctravel?amt=500&x=y');
  });
  it('returns null without a usable base or amount', () => {
    expect(mayaPaymentLink(null, 100)).toBeNull();
    expect(mayaPaymentLink('  ', 100)).toBeNull();
    expect(mayaPaymentLink('not a url', 100)).toBeNull();
    expect(mayaPaymentLink('https://mymaya.me/x', 0)).toBeNull();
  });
});
