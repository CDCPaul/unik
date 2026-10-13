import { describe, expect, it } from 'vitest';
import { canRemoveDeparture, computeDepartureUsage, defaultTourConfig, newDeparture, validateTourConfig } from './tourSettings';

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

describe('validateTourConfig: in-use departures and dates', () => {
  it('flags a departure with applications that was removed from settings', () => {
    const usage = { mnl: { seatsUsed: 3, applications: 2 } };
    const removed = valid();
    removed.departures = [];
    expect(validateTourConfig(removed, usage).errors['departures.removed']).toBe('Departure(s) in use cannot be removed or renamed: mnl. Close them instead.');
    expect(validateTourConfig(valid(), usage).errors).not.toHaveProperty('departures.removed');
  });
  it('rejects dates that do not exist on the calendar', () => {
    const c = valid();
    c.departures[0].departDate = '2027-02-30';
    expect(validateTourConfig(c, {}).errors).toHaveProperty('departures.0.departDate');
  });
});

describe('canRemoveDeparture', () => {
  it('blocks removing a departure in use', () => {
    expect(canRemoveDeparture({ mnl: { seatsUsed: 0, applications: 1 } }, 'mnl')).toBe(false);
    expect(canRemoveDeparture({}, 'mnl')).toBe(true);
  });
});

describe('computeDepartureUsage', () => {
  const mk = (departureId: string, status: string, full: number) => ({ departure: { id: departureId }, status, counts: { full, tenK: 0, companion: 0 } }) as never;
  it('counts cancelled applications as references but not as seats; waitlist takes no seats', () => {
    const u = computeDepartureUsage([mk('mnl', 'new', 2), mk('mnl', 'waitlist', 3), mk('mnl', 'cancelled', 4), mk('ceb', 'cancelled', 1)]);
    expect(u.mnl).toEqual({ seatsUsed: 2, applications: 3 });
    expect(u.ceb).toEqual({ seatsUsed: 0, applications: 1 });
  });
  it('blocks removing a departure referenced only by cancelled applications', () => {
    const usage = computeDepartureUsage([mk('ceb', 'cancelled', 1)]);
    expect(canRemoveDeparture(usage, 'ceb')).toBe(false);
    const c = valid();
    expect(validateTourConfig(c, usage).errors['departures.removed']).toContain('ceb');
  });
});
