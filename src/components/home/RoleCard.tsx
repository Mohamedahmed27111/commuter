'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RoleCardButton {
  label: string;
  href: string;
  variant: 'outline' | 'filled';
  color: string;
}

interface RoleCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  accentColor: string;
  buttons: RoleCardButton[];
}

export default function RoleCard({ icon, iconBg, title, description, accentColor, buttons }: RoleCardProps) {
  const [hovered, setHovered] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#1C3557',
        border: `1.5px solid ${hovered ? accentColor : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 20,
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        width: 320,
        minWidth: 280,
        flex: '1 1 280px',
        maxWidth: 360,
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.15)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        cursor: 'default',
        boxSizing: 'border-box',
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ color: '#ffffff', fontSize: 21, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          {title}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {description}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
        {buttons.map((btn) =>
          btn.variant === 'filled' ? (
            <Link
              key={btn.label}
              href={btn.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 44, borderRadius: 10,
                background: hoveredBtn === btn.label ? btn.color + 'dd' : btn.color,
                color: '#0B1E3D',
                fontSize: 14, fontWeight: 700,
                textDecoration: 'none',
                transition: 'opacity 0.15s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={() => setHoveredBtn(btn.label)}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              {btn.label}
            </Link>
          ) : (
            <Link
              key={btn.label}
              href={btn.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 44, borderRadius: 10,
                border: `1.5px solid ${hoveredBtn === btn.label ? btn.color : 'rgba(255,255,255,0.25)'}`,
                color: hoveredBtn === btn.label ? btn.color : 'rgba(255,255,255,0.85)',
                fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
                transition: 'border-color 0.15s, color 0.15s',
                background: 'transparent',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={() => setHoveredBtn(btn.label)}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              {btn.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
