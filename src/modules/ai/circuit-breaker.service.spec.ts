import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  it('stays closed under the failure threshold', () => {
    const breaker = new CircuitBreakerService(5, 60000);
    for (let i = 0; i < 4; i++) breaker.recordFailure(1000);
    expect(breaker.getState(1000)).toBe('closed');
  });

  it('opens once the threshold is reached', () => {
    const breaker = new CircuitBreakerService(5, 60000);
    for (let i = 0; i < 5; i++) breaker.recordFailure(1000);
    expect(breaker.getState(1000)).toBe('open');
  });

  it('stays open until the cooldown elapses, then resets to closed', () => {
    const breaker = new CircuitBreakerService(5, 60000);
    for (let i = 0; i < 5; i++) breaker.recordFailure(1000);
    expect(breaker.getState(1000 + 59999)).toBe('open');
    expect(breaker.getState(1000 + 60000)).toBe('closed');
  });

  it('a success resets the consecutive failure count', () => {
    const breaker = new CircuitBreakerService(5, 60000);
    for (let i = 0; i < 4; i++) breaker.recordFailure(1000);
    breaker.recordSuccess();
    breaker.recordFailure(2000);
    expect(breaker.getState(2000)).toBe('closed');
  });

  it('reports remaining cooldown time while open', () => {
    const breaker = new CircuitBreakerService(1, 60000);
    breaker.recordFailure(1000);
    expect(breaker.getRemainingCooldownMs(1000)).toBe(60000);
    expect(breaker.getRemainingCooldownMs(1000 + 30000)).toBe(30000);
  });
});
