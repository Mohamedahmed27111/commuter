'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import type { CycleDay } from '@/types/cycle';
import DayRunCard from './DayRunCard';

export interface WeekCalendarProps {
  days:       CycleDay[];
  onStartRun: (runId: string) => void;
}

function DayStatusDot({ status, isToday }: { status: string; isToday: boolean }) {
  if (isToday) {
    return (
      <div className="w-3 h-3 rounded-full bg-[#00C2A8] animate-pulse flex-shrink-0" />
    );
  }
  if (status === 'completed') {
    return (
      <div className="w-3 h-3 rounded-full bg-[#27AE60] flex-shrink-0" />
    );
  }
  return (
    <div className="w-3 h-3 rounded-full bg-[#E2E8F0] flex-shrink-0" />
  );
}

export default function WeekCalendar({ days, onStartRun }: WeekCalendarProps) {
  const t = useTranslations('day_run');
  const tCycles = useTranslations('my_cycles');
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? ar : enUS;

  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(days.filter(d => d.is_today).map(d => d.date))
  );

  function toggleDay(date: string) {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) { next.delete(date); } else { next.add(date); }
      return next;
    });
  }

  if (days.length === 0) {
    return (
      <p className="text-sm text-[#5A6A7A] text-center py-12">{t('nothing_here')}</p>
    );
  }

  return (
    <div className="space-y-1">
      {days.map(day => (
        <div key={day.date}>

          <button
            onClick={() => toggleDay(day.date)}
            className="w-full flex items-center justify-between
              py-3 px-2 rounded-lg hover:bg-[#F8F9FA] transition-colors"
          >
            <div className="flex items-center gap-3">
              <DayStatusDot status={day.status} isToday={day.is_today} />
              <div className="text-start">
                <span className="text-sm font-semibold text-[#0B1E3D]">
                  {day.day_name}
                </span>
                <span className="text-xs text-[#5A6A7A] ms-1.5">
                  {format(parseISO(day.date), 'd MMM', { locale: dateLocale })}
                </span>
                {day.is_today && (
                  <span className="ms-2 text-xs bg-[#00C2A8] text-[#0B1E3D]
                    font-semibold px-1.5 py-0.5 rounded-full">
                    {tCycles('today_label')}
                  </span>
                )}
                {day.status === 'completed' && !day.is_today && (
                  <span className="ms-2 text-xs text-[#27AE60] font-medium">
                    {t('completed_badge')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9AA0A6]">
                {day.runs.length === 1
                  ? t('runs_one', { count: day.runs.length })
                  : t('runs_other', { count: day.runs.length })}
              </span>
              <span className="text-[#C5CDD6]">
                {expandedDays.has(day.date) ? '▴' : '▾'}
              </span>
            </div>
          </button>

          {expandedDays.has(day.date) && (
            <div className="ps-4 pb-2">
              {day.runs.map(run => (
                <DayRunCard
                  key={run.run_id}
                  run={run}
                  dayDate={day.date}
                  isToday={day.is_today}
                  onStart={onStartRun}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
