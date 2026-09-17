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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: categoryColor ?? '#9CA3AF' }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">
          {formatTime(startTime)}–{formatTime(endTime)}
          {categoryName && <span> · {categoryName}</span>}
        </p>
      </div>
    </div>
  );
}
