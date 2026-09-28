import { describe, expect, it } from 'vitest';
import { upgradeReason } from './premium';
import { ApiError } from './api';

describe('upgradeReason', () => {
  it('returns null for a non-ApiError', () => {
    expect(upgradeReason(new Error('boom'))).toBeNull();
  });

  it('returns null when the error body has no recognizable code', () => {
    const err = new ApiError(400, { message: 'Bad request' });
    expect(upgradeReason(err)).toBeNull();
  });

  it('recognizes PREMIUM_REQUIRED and carries the feature name through', () => {
    const err = new ApiError(403, {
      code: 'PREMIUM_REQUIRED',
      message: 'Fitur ini butuh Premium',
      feature: 'ai-coach',
    });
    expect(upgradeReason(err)).toEqual({
      kind: 'premium',
      message: 'Fitur ini butuh Premium',
      feature: 'ai-coach',
    });
  });

  it('recognizes LIMIT_REACHED only on the free plan', () => {
    const err = new ApiError(429, {
      code: 'LIMIT_REACHED',
      message: 'Batas harian tercapai',
      plan: 'free',
    });
    expect(upgradeReason(err)).toEqual({ kind: 'limit', message: 'Batas harian tercapai' });
  });

  it('does not treat LIMIT_REACHED as an upgrade reason on a paid plan', () => {
    const err = new ApiError(429, {
      code: 'LIMIT_REACHED',
      message: 'Batas harian tercapai',
      plan: 'premium',
    });
    expect(upgradeReason(err)).toBeNull();
  });
});
