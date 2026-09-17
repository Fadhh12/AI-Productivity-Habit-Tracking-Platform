export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

/**
 * Pure overlap check: two [start, end) ranges overlap if one starts before the
 * other ends, on both sides. Used to WARN (never block) when a new activity
 * log shares its category with an existing entry that overlaps in time.
 */
export class ActivityOverlapUtil {
  static overlaps(a: TimeRange, b: TimeRange): boolean {
    return a.startTime < b.endTime && a.endTime > b.startTime;
  }

  static findOverlapping(candidate: TimeRange, existing: TimeRange[]): TimeRange[] {
    return existing.filter((entry) => this.overlaps(candidate, entry));
  }
}
