import { ActivityOverlapUtil } from './activity-overlap.util';

const range = (start: string, end: string) => ({
  startTime: new Date(start),
  endTime: new Date(end),
});

describe('ActivityOverlapUtil', () => {
  it('detects overlapping ranges', () => {
    const a = range('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z');
    const b = range('2026-01-01T09:30:00Z', '2026-01-01T10:30:00Z');
    expect(ActivityOverlapUtil.overlaps(a, b)).toBe(true);
  });

  it('does not flag back-to-back ranges as overlapping', () => {
    const a = range('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z');
    const b = range('2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z');
    expect(ActivityOverlapUtil.overlaps(a, b)).toBe(false);
  });

  it('does not flag disjoint ranges as overlapping', () => {
    const a = range('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z');
    const b = range('2026-01-01T11:00:00Z', '2026-01-01T12:00:00Z');
    expect(ActivityOverlapUtil.overlaps(a, b)).toBe(false);
  });

  it('detects a range fully containing another', () => {
    const outer = range('2026-01-01T09:00:00Z', '2026-01-01T12:00:00Z');
    const inner = range('2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z');
    expect(ActivityOverlapUtil.overlaps(outer, inner)).toBe(true);
  });

  it('filters only the overlapping entries out of a list', () => {
    const candidate = range('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z');
    const existing = [
      range('2026-01-01T08:00:00Z', '2026-01-01T09:00:00Z'), // back-to-back, no overlap
      range('2026-01-01T09:30:00Z', '2026-01-01T09:45:00Z'), // overlaps
      range('2026-01-01T12:00:00Z', '2026-01-01T13:00:00Z'), // disjoint
    ];
    const result = ActivityOverlapUtil.findOverlapping(candidate, existing);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(existing[1]);
  });
});
