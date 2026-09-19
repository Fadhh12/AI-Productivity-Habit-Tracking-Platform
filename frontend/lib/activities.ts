import { apiFetch } from './api';
import { RepeatRule, generateOccurrenceDates } from './recurrence';

interface RecurringActivityPayload {
  title: string;
  categoryId?: string;
}

/** POSTs one activity per occurrence date (single date if `repeat` is 'none'). Failures are counted, not thrown, so partial success is possible. */
export async function createRecurringActivities(
  startDate: string,
  repeat: RepeatRule,
  untilDate: string | undefined,
  startTimeOfDay: string,
  endTimeOfDay: string,
  payload: RecurringActivityPayload,
): Promise<{ occurrenceCount: number; failCount: number }> {
  const occurrenceDates = generateOccurrenceDates(startDate, repeat, untilDate);
  let failCount = 0;
  for (const dateStr of occurrenceDates) {
    try {
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          startTime: new Date(`${dateStr}T${startTimeOfDay}:00`).toISOString(),
          endTime: new Date(`${dateStr}T${endTimeOfDay}:00`).toISOString(),
        }),
      });
    } catch {
      failCount += 1;
    }
  }
  return { occurrenceCount: occurrenceDates.length, failCount };
}
