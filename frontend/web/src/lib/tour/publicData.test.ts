import { describe, expect, it } from 'vitest';
import { departureStatus, lowestPrice } from './publicData';
import type { Availability, TourConfig } from '@unik/shared/domain';

const config = {
  acceptingApplications: true,
  currency: 'PHP',
  depositPerPax: 10000,
  bibQuota: { total: 3 },
  mayaPaymentLinkBase: null,
  notifyEmails: [],
  departures: [
    { id: 'mnl', label: 'Manila', departDate: '', returnDate: '', flightInfo: '', seatCapacity: 4, isOpen: true, prices: { full: 80000, tenK: 75000, companion: 70000 }, singleSupplement: 15000 },
    { id: 'ceb', label: 'Cebu', departDate: '', returnDate: '', flightInfo: '', seatCapacity: 4, isOpen: false, prices: { full: 70000, tenK: 65000, companion: 60000 }, singleSupplement: 15000 },
  ],
} satisfies TourConfig;
const availability: Availability = {
  bibsUsed: 2,
  bibsTotal: 3,
  departures: { mnl: { seatsUsed: 3, seatCapacity: 4 }, ceb: { seatsUsed: 0, seatCapacity: 4 } },
};

describe('departureStatus', () => {
  it('is closed when the departure or applications are closed', () => {
    expect(departureStatus(config, availability, 'ceb', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
    expect(departureStatus({ ...config, acceptingApplications: false }, availability, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
    expect(departureStatus(config, availability, 'xyz', { full: 1, tenK: 0, companion: 0 })).toBe('closed');
  });
  it('is full when the requested group does not fit', () => {
    expect(departureStatus(config, availability, 'mnl', { full: 2, tenK: 0, companion: 0 })).toBe('full');
    expect(departureStatus(config, availability, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('open');
  });
  it('is open when availability is unknown or lacks the departure', () => {
    expect(departureStatus(config, null, 'mnl', { full: 9, tenK: 0, companion: 0 })).toBe('open');
    expect(departureStatus(config, { ...availability, departures: {} }, 'mnl', { full: 1, tenK: 0, companion: 0 })).toBe('open');
  });
});

describe('lowestPrice', () => {
  it('uses open departures only', () => {
    expect(lowestPrice(config, 'full')).toBe(80000);
    expect(lowestPrice({ ...config, departures: [] }, 'full')).toBeNull();
  });
});
