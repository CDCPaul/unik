// 어드민에서 고객에게 연락·결제 요청할 때 쓰는 링크 생성.

/** 국가코드 + 국내번호(앞자리 0 제거)를 숫자만으로. 쓸 수 없으면 null. */
export function internationalDigits(dial: string, number: string): string | null {
  const country = dial.replace(/\D/g, '');
  let local = number.replace(/\D/g, '');
  if (!country || !local) return null;
  if (local.startsWith(country) && local.length > country.length + 6) local = local.slice(country.length);
  local = local.replace(/^0+/, '');
  if (local.length < 6) return null;
  return country + local;
}

export function whatsappLink(dial: string, number: string): string | null {
  const digits = internationalDigits(dial, number);
  return digits ? `https://wa.me/${digits}` : null;
}

export function viberLink(dial: string, number: string): string | null {
  const digits = internationalDigits(dial, number);
  return digits ? `viber://chat?number=%2B${digits}` : null;
}

/** Maya Payment Link 에 금액을 붙인다. base 가 없거나 URL 이 아니면 null. */
export function mayaPaymentLink(base: string | null, amount: number): string | null {
  if (!base || !base.trim() || !Number.isInteger(amount) || amount <= 0) return null;
  try {
    const url = new URL(base.trim());
    url.searchParams.set('amt', String(amount));
    return url.toString();
  } catch {
    return null;
  }
}
