import { CATEGORIES, isValidPrice } from '@unik/shared/domain';
import type { Departure } from '@unik/shared/domain';

type RatesSource = Pick<Departure, 'prices' | 'singleSupplement'>;

/** 가격 비교용 키. 잘못되거나 없는 가격은 모두 같은 "없음" 으로 본다. */
function ratesKey(d: RatesSource): string {
  const prices = CATEGORIES.map((c) => {
    const p = d.prices?.[c];
    return isValidPrice(p) ? p : null;
  });
  const single = isValidPrice(d.singleSupplement) ? d.singleSupplement : null;
  return JSON.stringify([prices, single]);
}

/** 두 출발편의 유형별 가격과 싱글 추가요금이 모두 같은가 */
export function sameRates(a: RatesSource, b: RatesSource): boolean {
  return ratesKey(a) === ratesKey(b);
}

/**
 * 가격(유형별 가격 + 싱글 추가요금)이 같은 출발편끼리 묶는다. 순서는 처음 나온 순서를 따른다.
 * 묶음이 하나면 모든 출발편의 가격이 같다는 뜻이다.
 */
export function groupDeparturesByRates<T extends RatesSource>(departures: readonly T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const d of departures) {
    const key = ratesKey(d);
    const group = groups.get(key);
    if (group) group.push(d);
    else groups.set(key, [d]);
  }
  return [...groups.values()];
}

/** 열린 출발편이 모두 같은 가격인가 (출발편이 0·1개여도 true) */
export function allSameRates(departures: readonly RatesSource[]): boolean {
  return groupDeparturesByRates(departures).length <= 1;
}

export interface FlightLeg {
  /** 구간이 정확히 둘일 때만 'Outbound' / 'Return' */
  label?: 'Outbound' | 'Return';
  text: string;
}

/**
 * 직원이 입력한 항공편 한 줄("LJ044 TAG–ICN … · LJ043 ICN–TAG …")을 구간별로 나눈다.
 * " · " 로 나누고, 정확히 두 구간이면 가는 편·오는 편 이름을 붙인다.
 */
export function splitFlightLegs(flightInfo: string | null | undefined): FlightLeg[] {
  const parts = (flightInfo ?? '')
    .split(' · ')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 2) {
    return [
      { label: 'Outbound', text: parts[0] },
      { label: 'Return', text: parts[1] },
    ];
  }
  return parts.map((text) => ({ text }));
}
