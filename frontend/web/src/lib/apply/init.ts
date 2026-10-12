import { isValidPromoCodeFormat, normalizePromoCode } from '@unik/shared/domain';
import type { ApplyState } from './model';

export interface InitialStateInput {
  /** 저장된 임시저장 (없으면 null) */
  draft: ApplyState | null;
  /** 주소의 ?code= 값 (원본) */
  urlCode: string | null;
  /** 이 기기에 저장된 추천코드 */
  storedCode: string | null;
  /** 새 신청에 쓸 멱등성 키 */
  freshKey: string;
  /** 임시저장이 없을 때의 빈 상태 */
  base: ApplyState;
}

function validCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = normalizePromoCode(raw);
  return isValidPromoCodeFormat(code) ? code : null;
}

/**
 * 신청 폼 시작 상태를 정한다.
 * - 임시저장의 멱등성 키는 제출을 시도한 적이 있을 때만 유지한다(같은 신청의 재시도).
 *   그렇지 않으면 새 키를 받아, 두 번째 신청이 첫 신청과 합쳐지지 않게 한다.
 * - 주소의 ?code= 가 저장된 코드·입력 중이던 코드·다른 코드로 적용된 프로모보다 우선한다.
 * - 저장된 코드는 빈 입력만 채운다(적용된 프로모나 입력 중인 코드는 덮지 않는다).
 */
export function resolveInitialState(input: InitialStateInput): { state: ApplyState; autoCheckCode: string | null } {
  const { draft, freshKey, base } = input;
  const url = validCode(input.urlCode);
  const stored = validCode(input.storedCode);

  let state: ApplyState = draft
    ? {
        ...draft,
        submitAttempted: draft.submitAttempted === true,
        idempotencyKey: draft.submitAttempted === true ? draft.idempotencyKey : freshKey,
      }
    : { ...base, idempotencyKey: freshKey, submitAttempted: false };

  if (url) {
    // 주소의 코드가 가장 우선: 입력 중이던 코드·저장된 코드를 덮고, 다른 코드로 적용돼 있던 프로모는 해제한다.
    state = { ...state, promoInput: url, promo: state.promo?.code === url ? state.promo : null };
  } else if (stored && !state.promo && !state.promoInput.trim()) {
    state = { ...state, promoInput: stored };
  }
  const typed = state.promoInput.trim() ? normalizePromoCode(state.promoInput) : null;
  // 이미 같은 코드가 적용돼 있으면 다시 확인하지 않는다.
  const autoCheckCode = typed && state.promo?.code !== typed ? typed : null;
  return { state, autoCheckCode };
}
