'use client';

interface WizardProgressProps {
  current: number; // 1-based: how many steps completed/active
  total:   number;
}

export default function WizardProgress({ current, total }: WizardProgressProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            borderRadius: 999,
            background: i < current ? '#00C2A8' : 'rgba(255,255,255,0.2)',
            width: i < current ? 24 : 8,
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}
