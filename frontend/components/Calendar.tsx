'use client';

import { useMemo, useState } from 'react';
import { dateToStr } from '@/lib/date';

const DAY_INITIALS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

interface CalendarProps {
  /** yyyy-mm-dd strings that should render a small activity indicator dot. */
  markedDates?: Set<string>;
  selectedDate?: string | null;
  onSelectDate: (dateStr: string) => void;
}

function toDateStr(year: number, month: number, day: number): string {
  return dateToStr(new Date(year, month, day));
}

export function Calendar({ markedDates, selectedDate, onSelectDate }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const initial = selectedDate ? new Date(`${selectedDate}T00:00:00`) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: { day: number | null; dateStr: string | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push({ day: null, dateStr: null });
    for (let d = 1; d <= daysInMonth; d++) result.push({ day: d, dateStr: toDateStr(viewYear, viewMonth, d) });
    return result;
  }, [viewYear, viewMonth]);

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function jumpToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const yearOptions = useMemo(() => {
    const base = today.getFullYear();
    const years: number[] = [];
    for (let y = base - 5; y <= base + 15; y++) years.push(y);
    if (!years.includes(viewYear)) years.push(viewYear);
    return years.sort((a, b) => a - b);
  }, [today, viewYear]);

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-xs">
        <button
          onClick={() => shiftMonth(-1)}
          title="Bulan sebelumnya"
          aria-label="Bulan sebelumnya"
          className="shrink-0 rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="min-w-0 rounded-lg border-0 bg-transparent py-1 pl-1.5 pr-0.5 font-label-lg text-label-lg font-bold text-text-primary hover:bg-surface-container-low focus:outline-none"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="min-w-0 rounded-lg border-0 bg-transparent py-1 pl-0.5 pr-1.5 font-label-lg text-label-lg font-bold text-text-primary hover:bg-surface-container-low focus:outline-none"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => shiftMonth(1)}
          title="Bulan berikutnya"
          aria-label="Bulan berikutnya"
          className="shrink-0 rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 text-center font-label-sm text-caption font-semibold text-text-muted">
        {DAY_INITIALS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center font-body-sm text-body-sm text-text-primary">
        {cells.map((cell, i) => {
          if (!cell.day || !cell.dateStr) return <span key={i} />;
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          const hasActivity = markedDates?.has(cell.dateStr);
          return (
            <button
              key={i}
              onClick={() => onSelectDate(cell.dateStr!)}
              type="button"
              className="flex flex-col items-center justify-center gap-0.5 py-1"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isSelected
                    ? 'bg-sidebar-dark font-bold text-white'
                    : isToday
                      ? 'bg-accent-lime font-bold text-text-primary shadow-sm'
                      : 'hover:bg-surface-container-low'
                }`}
              >
                {cell.day}
              </span>
              <span
                className={`h-1 w-1 rounded-full ${hasActivity && !isSelected ? 'bg-accent-lime' : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end border-t border-border-subtle pt-space-xs">
        <button
          onClick={jumpToToday}
          className="font-label-sm text-label-sm font-semibold text-tertiary hover:underline"
          type="button"
        >
          Hari ini
        </button>
      </div>
    </div>
  );
}
