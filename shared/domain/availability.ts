import type { ApplicationStatus, ApplicationSummary, Availability, Counts, TourConfig } from './types';
import { runnerCount, totalPax } from './counts';

/** 정원을 차지하는 상태인가 (취소·대기는 자리를 차지하지 않음) */
export function isActiveStatus(status: ApplicationStatus): boolean {
  return status !== 'cancelled' && status !== 'waitlist';
}

export function computeAvailability(
  config: Pick<TourConfig, 'bibQuota' | 'departures'>,
  apps: ApplicationSummary[],
): Availability {
  const departures: Availability['departures'] = {};
  for (const d of config.departures) departures[d.id] = { seatsUsed: 0, seatCapacity: d.seatCapacity };

  let bibsUsed = 0;
  for (const app of apps) {
    if (!isActiveStatus(app.status)) continue;
    bibsUsed += runnerCount(app.counts);
    const dep = departures[app.departureId];
    if (dep) dep.seatsUsed += totalPax(app.counts);
  }
  return { bibsUsed, bibsTotal: config.bibQuota.total, departures };
}

export function exceedsCapacity(av: Availability, departureId: string, counts: Counts): boolean {
  const dep = av.departures[departureId];
  if (!dep) return true;
  if (av.bibsUsed + runnerCount(counts) > av.bibsTotal) return true;
  return dep.seatsUsed + totalPax(counts) > dep.seatCapacity;
}
