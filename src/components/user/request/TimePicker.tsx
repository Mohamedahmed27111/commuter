'use client';

interface TimePickerProps {
  value: string; // "HH:MM" 24h
  onChange: (v: string) => void;
  label: string;
  error?: boolean;
}

export default function TimePicker({ value, onChange, label, error }: TimePickerProps) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#5A6A7A',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: `1.5px solid ${error ? '#E74C3C' : '#E2E8F0'}`,
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#0B1E3D',
          background: error ? '#FFF5F5' : '#fff',
          outline: 'none',
          minHeight: 44,
        }}
      />
    </div>
  );
}
