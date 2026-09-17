'use client';

import { useMemo, useState } from 'react';

const DAY_INITIALS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
const MONTH_LABEL_LOCALE = 'id-ID';

interface CalendarProps {
  /** yyyy-mm-dd strings that should render a small activity indicator dot. */
  markedDates?: Set<string>;
  selectedDate?: string | null;
  onSelectDate: (dateStr: string) => void;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
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

  function shiftYear(delta: number) {
    setViewYear((y) => y + delta);
  }

  function jumpToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(MONTH_LABEL_LOCALE, {
    month: 'long',
    year: 'numeric',
  });
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex items-center justify-between gap-space-xs">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => shiftYear(-1)}
            title="Tahun sebelumnya"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
          </button>
          <button
            onClick={() => shiftMonth(-1)}
            title="Bulan sebelumnya"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
        </div>
        <button
          onClick={jumpToToday}
          className="font-label-lg text-label-lg font-bold capitalize text-text-primary hover:text-primary"
          title="Kembali ke hari ini"
          type="button"
        >
          {monthLabel}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => shiftMonth(1)}
            title="Bulan berikutnya"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <button
            onClick={() => shiftYear(1)}
            title="Tahun berikutnya"
            className="rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
          </button>
        </div>
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
    </div>
  );
}
