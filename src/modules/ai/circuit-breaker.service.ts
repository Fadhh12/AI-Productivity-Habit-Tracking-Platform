import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CircuitState = 'closed' | 'open';

/**
 * Simple consecutive-failure circuit breaker: after N consecutive failures,
 * the circuit opens for a cooldown period, during which all calls are
 * short-circuited (no attempt made) so a struggling provider isn't hammered.
 * A single success while closed resets the failure count to zero.
 */
@Injectable()
export class CircuitBreakerService {
  private consecutiveFailures = 0;
  private openUntil: number | null = null;

  constructor(
    private readonly threshold: number = 5,
    private readonly cooldownMs: number = 60000,
  ) {}

  static fromConfig(config: ConfigService): CircuitBreakerService {
    return new CircuitBreakerService(
      config.get<number>('ai.circuitBreakerThreshold') ?? 5,
      config.get<number>('ai.circuitBreakerCooldownMs') ?? 60000,
    );
  }

  getState(now: number = Date.now()): CircuitState {
    if (this.openUntil !== null && now < this.openUntil) return 'open';
    if (this.openUntil !== null && now >= this.openUntil) {
      // Cooldown elapsed: allow a trial call through (half-open, treated as closed).
      this.openUntil = null;
      this.consecutiveFailures = 0;
    }
    return 'closed';
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openUntil = null;
  }

  recordFailure(now: number = Date.now()): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.threshold) {
      this.openUntil = now + this.cooldownMs;
    }
  }

  getRemainingCooldownMs(now: number = Date.now()): number {
    if (this.openUntil === null) return 0;
    return Math.max(0, this.openUntil - now);
  }
}
