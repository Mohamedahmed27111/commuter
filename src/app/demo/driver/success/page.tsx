'use client';

import Link from 'next/link';
import { CheckCircle, Car, Clock, Sliders } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import LanguageToggle from '@/components/layout/LanguageToggle';

export default function DemoDriverSuccessPage() {
  const t = useTranslations('demo');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const STEPS_DONE = [
    { icon: <CheckCircle size={18} />, label: t('success.step1_done') },
    { icon: <Car size={18} />,         label: t('success.step2_done') },
    { icon: <Clock size={18} />,       label: t('success.step3_done') },
    { icon: <Sliders size={18} />,     label: t('success.step4_done') },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
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
        {/* Language toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <LanguageToggle />
        </div>

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
          {t('success.title')}
        </h1>
        <p style={{ fontSize: 15, color: '#5A6A7A', lineHeight: 1.6, marginBottom: 32 }}>
          {t('success.subtitle')}
        </p>

        {/* Steps completed */}
        <div
          style={{
            background: '#F8F9FA', borderRadius: 12, padding: '16px 20px',
            marginBottom: 32, textAlign: isRtl ? 'right' : 'left',
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
          {t('success.sign_in_btn')}
        </Link>

        <p style={{ marginTop: 16, fontSize: 13, color: '#9CA3AF' }}>
          {t('success.start_over')}{' '}
          <Link href="/demo/driver/sign-up" style={{ color: '#00C2A8', fontWeight: 600 }}>
            {t('success.start_over_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
