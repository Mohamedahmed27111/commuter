'use client';

import { getQuarterHourOptions, timeDiffMinutes, addMinutes, formatTime12h } from '@/lib/timeUtils';
import { useTranslations } from 'next-intl';

interface ArrivalWindowPickerProps {
  label:       string;
  arrivalFrom: string;   // "HH:MM" snapped to :00 or :30
  arrivalTo:   string;
  onChange:    (from: string, to: string) => void;
  error?:      boolean;
}

// Produced once at module level — 48 options, stable reference
const ALL_OPTIONS = getQuarterHourOptions();

export default function ArrivalWindowPicker({
  label,
  arrivalFrom,
  arrivalTo,
  onChange,
  error = false,
}: ArrivalWindowPickerProps) {
  const t = useTranslations('request_form');

  // Valid "to" options: arrivalFrom + 30 min  →  arrivalFrom + 120 min
  const validToOptions = ALL_OPTIONS.filter(opt => {
    const diff = timeDiffMinutes(arrivalFrom, opt);
    return diff >= 30 && diff <= 120;
  });

  const gap = timeDiffMinutes(arrivalFrom, arrivalTo);

  function handleFromChange(newFrom: string) {
    // Reset "to" to newFrom + 30 min whenever "from" changes
    onChange(newFrom, addMinutes(newFrom, 30));
  }

  function handleToChange(newTo: string) {
    const diff = timeDiffMinutes(arrivalFrom, newTo);
    if (diff < 30)  { onChange(arrivalFrom, addMinutes(arrivalFrom, 30));  return; }
    if (diff > 120) { onChange(arrivalFrom, addMinutes(arrivalFrom, 120)); return; }
    onChange(arrivalFrom, newTo);
  }

  const selectClass = [
    'w-full h-11 border rounded-lg px-3 text-sm bg-white outline-none',
    'focus:ring-2 focus:ring-[#00C2A8]/20',
    error
      ? 'border-[#EF4444] bg-[#FFF5F5] focus:border-[#EF4444]'
      : 'border-[#E2E8F0] focus:border-[#00C2A8]',
  ].join(' ');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-[#0B1E3D]">{label}</label>

      <div className="grid grid-cols-2 gap-3">
        {/* FROM */}
        <div>
          <div className="text-xs text-[#5A6A7A] mb-1">{t('arrival_from')}</div>
          <select
            value={arrivalFrom}
            onChange={e => handleFromChange(e.target.value)}
            className={selectClass}
            style={{ color: '#0B1E3D', fontFamily: 'inherit' }}
          >
            {ALL_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{formatTime12h(opt)}</option>
            ))}
          </select>
        </div>

        {/* TO — filtered to valid range only */}
        <div>
          <div className="text-xs text-[#5A6A7A] mb-1">{t('arrival_to')}</div>
          <select
            value={validToOptions.includes(arrivalTo) ? arrivalTo : validToOptions[0] ?? arrivalTo}
            onChange={e => handleToChange(e.target.value)}
            className={selectClass}
            style={{ color: '#0B1E3D', fontFamily: 'inherit' }}
          >
            {validToOptions.map(opt => (
              <option key={opt} value={opt}>{formatTime12h(opt)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gap info */}
      <p className="text-xs text-[#5A6A7A]">
        {t('arrival_window_note', { gap })}
        {' · '}
        {formatTime12h(arrivalFrom)} → {formatTime12h(arrivalTo)}
      </p>

      {error && (
        <p className="text-xs text-[#EF4444]">{t('arrival_min_error')}</p>
      )}
    </div>
  );
}
