import { describe, expect, it } from 'vitest';
import { canRemoveDeparture, defaultTourConfig, newDeparture, validateTourConfig } from './tourSettings';

function valid() {
  const c = defaultTourConfig();
  c.depositPerPax = 10000;
  c.bibQuota.total = 200;
  c.notifyEmails = ['staff@cebudirectclub.com'];
  c.departures = [{ ...newDeparture(), id: 'mnl', label: 'Manila (MNL)', departDate: '2027-03-19', returnDate: '2027-03-23', seatCapacity: 120, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 }];
  return c;
}

describe('validateTourConfig', () => {
  it('accepts a valid config', () => {
    expect(validateTourConfig(valid(), {})).toEqual({ errors: {}, warnings: [] });
  });
  it('defaults are closed for applications', () => {
    expect(defaultTourConfig().acceptingApplications).toBe(false);
  });
  it('rejects bad numbers, ids, dates, emails and Maya URL', () => {
    const c = valid();
    c.depositPerPax = -1;
    c.bibQuota.total = 1.5;
    c.notifyEmails = ['nope'];
    c.mayaPaymentLinkBase = 'http://insecure.example';
    c.departures.push({ ...c.departures[0], id: 'mnl' });
    c.departures.push({ ...newDeparture(), id: 'Bad Id', label: '', departDate: '2027-03-23', returnDate: '2027-03-19', prices: { full: -1, tenK: 0, companion: 0 } });
    const { errors } = validateTourConfig(c, {});
    expect(Object.keys(errors).sort()).toEqual(
      [
        'bibQuota.total',
        'depositPerPax',
        'departures.1.id',
        'departures.2.id',
        'departures.2.label',
        'departures.2.prices.full',
        'departures.2.returnDate',
        'mayaPaymentLinkBase',
        'notifyEmails',
      ].sort(),
    );
  });
  it('warns when capacity drops below seats used', () => {
    const c = valid();
    c.departures[0].seatCapacity = 10;
    expect(validateTourConfig(c, { mnl: { seatsUsed: 12, applications: 5 } }).warnings).toEqual([
      'Manila (MNL): capacity 10 is below the 12 seats already taken. New applications will go to the waitlist.',
    ]);
  });
});

describe('canRemoveDeparture', () => {
  it('blocks removing a departure in use', () => {
    expect(canRemoveDeparture({ mnl: { seatsUsed: 0, applications: 1 } }, 'mnl')).toBe(false);
    expect(canRemoveDeparture({}, 'mnl')).toBe(true);
  });
});
