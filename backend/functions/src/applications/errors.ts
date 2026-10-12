export type SubmitErrorCode = 'invalid_input' | 'closed' | 'departure_closed' | 'promo_invalid';

export class SubmitError extends Error {
  constructor(
    public readonly code: SubmitErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'SubmitError';
  }
}
