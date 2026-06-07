'use client';

import Link from 'next/link';
import { CheckCircle, Car, Clock, Sliders } from 'lucide-react';

const STEPS_DONE = [
  { icon: <CheckCircle size={18} />, label: 'Account created' },
  { icon: <Car size={18} />,         label: 'Car details saved' },
  { icon: <Clock size={18} />,       label: 'Availability set' },
  { icon: <Sliders size={18} />,     label: 'Preferences configured' },
];

export default function DemoDriverSuccessPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F9FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 4px 32px rgba(11,30,61,0.10)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00C2A8, #00a090)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px rgba(0,194,168,0.30)',
          }}
        >
          <CheckCircle size={36} color="#0B1E3D" strokeWidth={2.5} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B1E3D', marginBottom: 8 }}>
          You&apos;re all set! 🎉
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A', lineHeight: 1.6, marginBottom: 32 }}>
          Your driver profile is complete. Our team will review your details and reach out soon.
        </p>

        {/* Steps completed */}
        <div
          style={{
            background: '#F8F9FA', borderRadius: 12, padding: '16px 20px',
            marginBottom: 32, textAlign: 'left',
          }}
        >
          {STEPS_DONE.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < STEPS_DONE.length - 1 ? '1px solid #E2E8F0' : 'none',
              }}
            >
              <span style={{ color: '#00C2A8' }}>{s.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#0B1E3D' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/driver/sign-in"
          style={{
            display: 'block', width: '100%', height: 52, lineHeight: '52px',
            background: '#00C2A8', color: '#0B1E3D',
            borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          Sign in to your account →
        </Link>

        <p style={{ marginTop: 16, fontSize: 13, color: '#9CA3AF' }}>
          Want to register another demo account?{' '}
          <Link href="/demo/driver/sign-up" style={{ color: '#00C2A8', fontWeight: 600 }}>
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
