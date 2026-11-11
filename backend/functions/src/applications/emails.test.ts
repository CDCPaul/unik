import { describe, expect, it } from 'vitest';
import { customerEmail, staffEmail, type ApplicationEmailData } from './emails';

const app: ApplicationEmailData = {
  appNo: 'APP-0021',
  status: 'new',
  lead: {
    firstName: 'Maria',
    lastName: '<img src=x onerror=alert(1)>',
    email: 'maria@example.com',
    phoneDial: '+63',
    phoneNumber: '917 123 4567',
    viber: true,
    whatsapp: false,
  },
  departure: { id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23' },
  counts: { full: 2, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 0, childNoBed: 0, infant: 0 },
  pricing: {
    lines: [],
    singleSupplements: 0,
    subtotal: 230000,
    promo: { code: 'TA-SUNRISE', agencyName: 'Sunrise Travel', type: 'fixed', value: 2000, discountTotal: 6000 },
    total: 224000,
    depositDue: 30000,
  },
  specialRequests: '<script>x</script>',
};

describe('application emails', () => {
  it('customer email confirms number, travelers and estimated total', () => {
    const { subject, html } = customerEmail(app);
    expect(subject).toBe('We received your application APP-0021 | Seoul Marathon 2027 Tour');
    expect(html).toContain('2 Full Marathon (18+), 1 Companion');
    expect(html).toContain('PHP 224,000');
    expect(html).toContain('No payment is needed yet');
  });
  it('shows a referral-only code by agency name, without a zero discount', () => {
    const referral = { ...app, pricing: { ...app.pricing, promo: { code: 'GRH_C', agencyName: 'GRAND HOPE SM', type: 'fixed' as const, value: 0, discountTotal: 0 } } };
    const { html } = customerEmail(referral);
    expect(html).toContain('GRH_C (GRAND HOPE SM)');
    expect(html).not.toContain('−PHP 0');
  });
  it('customer email explains the waitlist', () => {
    const { subject, html } = customerEmail({ ...app, status: 'waitlist' });
    expect(subject).toBe("You're on the waitlist (APP-0021) | Seoul Marathon 2027 Tour");
    expect(html).toContain('waitlist');
    expect(html).toContain('All available slots are currently taken, so we have added you to the waitlist.');
  });
  it('staff email links to the admin detail and summarises the booking', () => {
    const { subject, html } = staffEmail(app, 'doc-123');
    expect(subject).toBe('[UNIK] APP-0021 Maria <img src=x onerror=alert(1)> | 3 pax | TA-SUNRISE');
    expect(html).toContain('https://unik.ph/admin/applicants?id=doc-123');
  });
  it('lists children and infants and counts them as pax', () => {
    const family = { ...app, counts: { full: 1, tenK: 0, companion: 1, childTenK: 0, childTenKNoBed: 0, child: 1, childNoBed: 0, infant: 1 } };
    expect(customerEmail(family).html).toContain('1 Full Marathon (18+), 1 Companion, 1 Child (with bed), 1 Infant (under 2)');
    expect(staffEmail(family, 'd').subject).toContain('| 4 pax |');
  });
  it('lists all four child types in category order', () => {
    const family = { ...app, counts: { full: 0, tenK: 1, companion: 1, childTenK: 1, childTenKNoBed: 2, child: 1, childNoBed: 1, infant: 1 } };
    expect(customerEmail(family).html).toContain(
      '1 10K, 1 Companion, 1 Child 10K (with bed), 2 Child 10K (no bed), 1 Child (with bed), 1 Child (no bed), 1 Infant (under 2)',
    );
    expect(staffEmail(family, 'd').subject).toContain('| 8 pax |');
  });
  it('staff email shows the preferred call time, or Any time when none was chosen', () => {
    const withTimes = { ...app, lead: { ...app.lead, contactTimes: ['evening', 'morning'] } };
    expect(staffEmail(withTimes, 'd').html).toContain('Best time to call (PH time): 8 AM – 12 PM, 5 PM – 8 PM');
    expect(staffEmail(app, 'd').html).toContain('Best time to call (PH time): Any time');
  });
  it('escapes user-provided text', () => {
    for (const { html } of [customerEmail(app), staffEmail(app, 'doc-123')]) {
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x');
    }
    expect(staffEmail(app, 'd').html).toContain('&lt;script&gt;x&lt;/script&gt;');
  });
});
