'use client';

import type { SeatPreference } from '@/hooks/useRequestForm';

interface SeatMapDiagramProps {
  selected: SeatPreference;
}

// Color helpers
function seatColor(type: 'window' | 'aisle' | 'middle', selected: SeatPreference) {
  if (selected === 'any') return '#00C2A8';
  if (selected === 'window' && type === 'window') return '#00C2A8';
  if (selected === 'aisle' && type === 'aisle') return '#00C2A8';
  return '#E2E8F0';
}
function seatTextColor(type: 'window' | 'aisle' | 'middle', selected: SeatPreference) {
  if (selected === 'any') return '#fff';
  if (selected === 'window' && type === 'window') return '#fff';
  if (selected === 'aisle' && type === 'aisle') return '#fff';
  return '#94A3B8';
}

function Seat({ type, selected }: { type: 'window' | 'aisle' | 'middle'; selected: SeatPreference }) {
  const bg = seatColor(type, selected);
  const color = seatTextColor(type, selected);
  const icon = type === 'window' ? '🪟' : type === 'aisle' ? '💺' : '💺';
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        transition: 'background 0.2s',
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

export default function SeatMapDiagram({ selected }: SeatMapDiagramProps) {
  // rows: [window, aisle, door-indicator]
  const rows: Array<{ window: boolean; aisle: boolean; hasMiddle: boolean }> = [
    { window: true, aisle: true, hasMiddle: false },
    { window: true, aisle: true, hasMiddle: false },
    { window: true, aisle: false, hasMiddle: true }, // back row has window on both sides
  ];

  return (
    <div
      style={{
        background: '#F8F9FA',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, alignSelf: 'flex-start' }}>
        Top-down view
      </div>

      {/* Driver row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 12, color: '#94A3B8' }}>Driver</div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: '#0B1E3D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🚗
        </div>
        <div style={{ width: 32 }} />
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: '#E2E8F0' }} />

      {/* Passenger rows */}
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Seat type="window" selected={selected} />
          {row.hasMiddle ? (
            <Seat type="aisle" selected={selected} />
          ) : (
            <Seat type="aisle" selected={selected} />
          )}
          {row.hasMiddle ? (
            <Seat type="window" selected={selected} />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: '#CBD5E1',
              }}
            >
              🚪
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 4,
          fontSize: 11,
          color: '#94A3B8',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: '#00C2A8',
              marginRight: 3,
              verticalAlign: 'middle',
            }}
          />
          Selected
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: '#E2E8F0',
              marginRight: 3,
              verticalAlign: 'middle',
            }}
          />
          Other
        </span>
      </div>
    </div>
  );
}
