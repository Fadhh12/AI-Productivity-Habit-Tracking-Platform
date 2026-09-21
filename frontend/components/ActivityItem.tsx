interface ActivityItemProps {
  title: string;
  startTime: string;
  endTime: string;
  categoryName?: string | null;
  categoryColor?: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function ActivityItem({ title, startTime, endTime, categoryName, categoryColor }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-space-md rounded-2xl p-space-sm transition-colors hover:bg-surface-container-low">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${categoryColor ? '' : 'bg-surface-container'}`}
        style={categoryColor ? { backgroundColor: `${categoryColor}22` } : undefined}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor ?? '#A1A1AA' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-label-md text-label-md font-semibold text-text-primary">{title}</p>
        <p className="font-caption text-caption text-text-muted">
          {formatTime(startTime)} – {formatTime(endTime)}
          {categoryName && <span> · {categoryName}</span>}
        </p>
      </div>
      <span className="material-symbols-outlined text-[18px] text-text-muted">chevron_right</span>
    </div>
  );
}
