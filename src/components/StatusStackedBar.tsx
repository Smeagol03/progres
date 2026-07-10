import type { StatusPembayaran } from '../types';

interface StatusItem {
  label: string;
  count: number;
  status: StatusPembayaran;
  color: string;
  bgColor: string;
}

interface StatusStackedBarProps {
  data: StatusItem[];
  total: number;
}

export default function StatusStackedBar({ data, total }: StatusStackedBarProps) {
  if (total === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex h-5 rounded-full overflow-hidden bg-gray-100">
        {data.map((s) =>
          s.count > 0 ? (
            <div
              key={s.status}
              className={`${s.color} transition-all duration-700`}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count} paket`}
            />
          ) : null
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.map((s) => (
          <div
            key={s.status}
            className={`${s.bgColor} rounded-lg px-2 md:px-3 py-2 flex items-center gap-1.5 md:gap-2 min-w-0`}
          >
            <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${s.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-gray-500 truncate">{s.label}</p>
              <p className="font-mono font-bold text-xs md:text-sm text-navy truncate">
                {s.count} <span className="font-normal text-gray-400 text-[10px] md:text-xs">({Math.round((s.count / total) * 100)}%)</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
