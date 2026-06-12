'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import DayRunCard from '@/components/driver/DayRunCard';
import WeekCalendar from '@/components/driver/WeekCalendar';
import EmptyState from '@/components/shared/EmptyState';
import type { DriverCycleSchedule } from '@/types/cycle';

type TabKey = 'active' | 'pending' | 'completed';

export default function MyCyclesPage() {
  const t = useTranslations('my_cycles');
  const locale = useLocale();
  const dateLocale = locale === 'ar' ? ar : enUS;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const schedule: DriverCycleSchedule = {
    cycle_id: '',
    status: 'confirmed',
    days: [],
    cycle_start_date: new Date().toISOString().split('T')[0],
    cycle_end_date: new Date().toISOString().split('T')[0],
  }; // TODO: fetch from API

  const todayDays     = schedule.days.filter(d => d.is_today);
  const pendingDays   = schedule.days.filter(d => !d.is_today && d.status === 'upcoming');
  const completedDays = schedule.days.filter(d => d.status === 'completed');

  function handleStartRun(runId: string) {
    router.push(`/driver/trip/${runId}`);
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'active',    label: t('tab_active_runs') },
    { key: 'pending',   label: t('tab_pending') },
    { key: 'completed', label: t('tab_completed') },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0B1E3D]">{t('page_title')}</h1>
        <p className="text-sm text-[#5A6A7A] mt-0.5">
          {t('cycle_label')}{' '}
          {format(parseISO(schedule.cycle_start_date), 'EEE d MMM', { locale: dateLocale })}
          {' '}–{' '}
          {format(parseISO(schedule.cycle_end_date), 'EEE d MMM yyyy', { locale: dateLocale })}
        </p>
      </div>

      <div className="flex border-b border-[#E2E8F0] mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 me-6 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#00C2A8] text-[#0B1E3D]'
                : 'border-transparent text-[#5A6A7A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'active' && (
        <div>
          {todayDays.length === 0 ? (
            <EmptyState
              icon="🚗"
              title={t('empty_active_runs')}
              description={t('empty_active_runs_desc')}
            />
          ) : (
            <>
              <p className="text-xs font-semibold text-[#5A6A7A] uppercase tracking-wide mb-3">
                {todayDays[0].day_name},{' '}
                {format(parseISO(todayDays[0].date), 'd MMM', { locale: dateLocale })} · {t('today_label')}
              </p>
              {todayDays[0].runs.map(run => (
                <DayRunCard
                  key={run.run_id}
                  run={run}
                  dayDate={todayDays[0].date}
                  isToday={true}
                  onStart={handleStartRun}
                />
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        pendingDays.length === 0 ? (
          <EmptyState
            icon="📅"
            title={t('empty_upcoming')}
            description={t('empty_upcoming_desc')}
          />
        ) : (
          <WeekCalendar days={pendingDays} onStartRun={handleStartRun} />
        )
      )}

      {activeTab === 'completed' && (
        completedDays.length === 0 ? (
          <EmptyState
            icon="✅"
            title={t('empty_completed_days')}
            description={t('empty_completed_days_desc')}
          />
        ) : (
          <WeekCalendar days={completedDays} onStartRun={() => {}} />
        )
      )}
    </div>
  );
}
