'use client';

interface StatCard {
  label: string;
  value: number;
  dotColor: string;
  accent: string;
}

interface DashboardStatsProps {
  stats: StatCard[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      role="list"
      aria-label="Dashboard statistics"
    >
      {stats.map((card) => (
        <div
          key={card.label}
          role="listitem"
          className="bg-white rounded-md border border-primary/10 px-4 py-4 flex flex-col gap-3 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <span
              className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${card.dotColor}`}
              aria-hidden="true"
            />
          </div>
          <div>
            <p
              className={`text-[32px] font-bold leading-none ${card.accent}`}
              aria-label={`${card.value} ${card.label}`}
            >
              {card.value}
            </p>
            <p className="text-text-muted text-[14px] mt-1">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
