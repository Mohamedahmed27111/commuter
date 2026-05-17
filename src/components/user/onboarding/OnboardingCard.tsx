'use client';

interface OnboardingCardProps {
  icon:        string;
  title:       string;
  description: string;
  bullets?:    string[];
  ctaLabel:    string;
  onClick:     () => void;
  accentColor?: string;
}

export default function OnboardingCard({
  icon,
  title,
  description,
  bullets,
  ctaLabel,
  onClick,
  accentColor = '#00C2A8',
}: OnboardingCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#1C3557',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 32,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = accentColor;
        el.style.transform = 'translateY(-4px)';
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(255,255,255,0.1)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          background: `${accentColor}20`,
          border: `1.5px solid ${accentColor}30`,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 4 }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{description}</p>
      </div>

      {bullets && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              <span style={{ color: accentColor, fontSize: 10 }}>●</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          marginTop: 'auto',
          width: '100%',
          height: 44,
          borderRadius: 12,
          border: 'none',
          background: accentColor,
          color: '#0B1E3D',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
