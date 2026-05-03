'use client';

import { useState, useRef } from 'react';
import { Car, Layers, Palette, Hash } from 'lucide-react';

export interface Step2Data {
  carType: 'private' | 'taxi';
  carBrand: string;
  carModel: string;
  carYear: number | '';
  carColor: string;
  carColorCustom: string;
  plateL1: string;
  plateL2: string;
  plateL3: string;
  plateNumber: string;
  licensePlate: string;
}

interface Step2Props {
  initial: Partial<Step2Data>;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

const COLORS: { label: string; value: string; hex: string }[] = [
  { label: 'White',  value: 'white',  hex: '#F5F5F5' },
  { label: 'Silver', value: 'silver', hex: '#C0C0C0' },
  { label: 'Grey',   value: 'grey',   hex: '#6B7280' },
  { label: 'Black',  value: 'black',  hex: '#1F2937' },
  { label: 'Red',    value: 'red',    hex: '#EF4444' },
  { label: 'Maroon', value: 'maroon', hex: '#7F1D1D' },
  { label: 'Blue',   value: 'blue',   hex: '#3B82F6' },
  { label: 'Navy',   value: 'navy',   hex: '#1E3A5F' },
  { label: 'Green',  value: 'green',  hex: '#22C55E' },
  { label: 'Brown',  value: 'brown',  hex: '#92400E' },
  { label: 'Beige',  value: 'beige',  hex: '#D4B896' },
  { label: 'Yellow', value: 'yellow', hex: '#FACC15' },
  { label: 'Orange', value: 'orange', hex: '#F97316' },
  { label: 'Other',  value: 'other',  hex: '' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2005 + 1 }, (_, i) => CURRENT_YEAR - i);

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#F8F9FA', borderBottom: '1px solid #E2E8F0' }}>
        <span style={{ color: '#5A6A7A', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1E3D' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function ColorSwatchGrid({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, padding: '12px', background: '#F8F9FA', border: `1.5px solid ${error ? '#E74C3C' : '#E2E8F0'}`, borderRadius: 12 }}>
        {COLORS.map((c) => {
          const active = value === c.value;
          return (
            <button key={c.value} type="button" title={c.label} onClick={() => onChange(c.value)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 4px', border: active ? '2px solid #00C2A8' : '2px solid transparent', borderRadius: 8, background: active ? '#EFF7F6' : 'transparent', cursor: 'pointer', transition: 'all 0.12s' }}
            >
              {c.hex ? (
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: c.hex, border: c.value === 'white' ? '1px solid #D1D5DB' : '1px solid rgba(0,0,0,0.08)', boxShadow: active ? '0 0 0 2px #00C2A8' : 'none', flexShrink: 0 }} />
              ) : (
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '1px solid #D1D5DB', boxShadow: active ? '0 0 0 2px #00C2A8' : 'none', flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 9, color: active ? '#00C2A8' : '#6B7280', fontWeight: active ? 600 : 400, lineHeight: 1, textAlign: 'center' }}>{c.label}</span>
            </button>
          );
        })}
      </div>
      {value && (
        <p style={{ fontSize: 12, color: '#00C2A8', marginTop: 4, fontWeight: 500 }}>
          {'\u2713 '}{COLORS.find(c => c.value === value)?.label ?? value}
        </p>
      )}
    </div>
  );
}

interface PlateLetterInputProps {
  value: string;
  onChange: (v: string) => void;
  onBackspace: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
  error: boolean;
}

function PlateLetterInput({ value, onChange, onBackspace, inputRef, placeholder, error }: PlateLetterInputProps) {
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      dir="rtl"
      lang="ar"
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={2}
      placeholder={placeholder}
      onChange={(e) => {
        const arabic = e.target.value.replace(/[^\u0600-\u06FF]/g, '');
        onChange(arabic.slice(-1));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !value) onBackspace();
      }}
      style={{
        width: 52, height: 52, textAlign: 'center', fontFamily: 'inherit',
        border: `1.5px solid ${error ? '#E74C3C' : value ? '#00C2A8' : '#D1D5DB'}`,
        borderRadius: 10, fontSize: value ? 22 : 15, fontWeight: 700,
        color: value ? '#0B1E3D' : '#9CA3AF',
        background: '#fff', outline: 'none', cursor: 'text',
        boxShadow: value ? '0 0 0 3px #00C2A833' : 'none',
        transition: 'all 0.15s',
      }}
      aria-label="Plate letter"
    />
  );
}

export default function Step2CarInfo({ initial, onNext, onBack }: Step2Props) {
  const [form, setForm] = useState<Step2Data>({
    carType:        (initial.carType as Step2Data['carType']) ?? 'private',
    carBrand:       initial.carBrand       ?? '',
    carModel:       initial.carModel       ?? '',
    carYear:        initial.carYear        ?? '',
    carColor:       initial.carColor       ?? '',
    carColorCustom: initial.carColorCustom ?? '',
    plateL1:        initial.plateL1        ?? '',
    plateL2:        initial.plateL2        ?? '',
    plateL3:        initial.plateL3        ?? '',
    plateNumber:    initial.plateNumber    ?? '',
    licensePlate:   initial.licensePlate   ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const plateL1Ref = useRef<HTMLInputElement>(null);
  const plateL2Ref = useRef<HTMLInputElement>(null);
  const plateL3Ref = useRef<HTMLInputElement>(null);
  const numRef     = useRef<HTMLInputElement>(null);

  const set = (k: keyof Step2Data) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleNumber(val: string) {
    if (!/^\d{0,4}$/.test(val)) return;
    setForm((f) => ({ ...f, plateNumber: val }));
  }

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!form.carBrand.trim()) e.carBrand = 'Enter the car brand.';
    if (!form.carModel.trim()) e.carModel = 'Enter the car model.';
    if (!form.carYear)  e.carYear  = 'Select a year.';
    if (!form.carColor) e.carColor = 'Select a color.';
    if (form.carColor === 'other' && !form.carColorCustom.trim()) e.carColorCustom = 'Please specify the color.';
    if (!form.plateL1 || !form.plateL2 || !form.plateL3) e.plate = 'Enter all 3 Arabic letters.';
    else if (!form.plateNumber) e.plate = 'Enter the plate number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const plate = `${form.plateL1}${form.plateL2}${form.plateL3} ${form.plateNumber}`;
    onNext({ ...form, carYear: Number(form.carYear) as number, licensePlate: plate });
  }

  const selectCls = (err?: string) => [
    'w-full h-[52px] border rounded-lg text-sm text-primary bg-white px-4',
    'focus:outline-none transition-all appearance-none',
    err ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
        : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
  ].join(' ');

  const inputCls = (err?: string) => [
    'w-full h-[52px] border rounded-lg text-sm text-primary bg-white px-4',
    'focus:outline-none transition-all',
    err ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/15'
        : 'border-[#D1D5DB] focus:border-secondary focus:ring-2 focus:ring-secondary/15',
  ].join(' ');

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Car type */}
      <SectionCard icon={<Car size={14} />} title="Car type">
        <div className="grid grid-cols-2 gap-3">
          {(['private', 'taxi'] as const).map((type) => {
            const active = form.carType === type;
            return (
              <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, carType: type }))}
                style={{ padding: '14px 16px', borderRadius: 12, border: active ? '2px solid #00C2A8' : '2px solid #E2E8F0', background: active ? '#EFF7F6' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', transition: 'all 0.15s' }}
              >
                <span style={{ fontSize: 24 }}>{type === 'private' ? '\uD83D\uDE97' : '\uD83D\uDE95'}</span>
                <span>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: active ? '#0B1E3D' : '#5A6A7A', textAlign: 'left' }}>{type === 'private' ? 'Private car' : 'Taxi'}</span>
                  <span style={{ display: 'block', fontSize: 11, color: active ? '#00C2A8' : '#9CA3AF', textAlign: 'left', marginTop: 1 }}>{type === 'private' ? 'Personal vehicle' : 'Licensed taxi'}</span>
                </span>
                <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', border: active ? '5px solid #00C2A8' : '2px solid #D1D5DB', background: '#fff', flexShrink: 0, transition: 'all 0.15s' }} />
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Vehicle details */}
      <SectionCard icon={<Layers size={14} />} title="Vehicle details">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-primary mb-1.5">Brand</label>
            <input
              type="text"
              value={form.carBrand}
              onChange={set('carBrand')}
              placeholder="e.g. Toyota"
              className={inputCls(errors.carBrand)}
            />
            {errors.carBrand && <p className="mt-1 text-xs text-danger">{errors.carBrand}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-primary mb-1.5">Model</label>
            <input
              type="text"
              value={form.carModel}
              onChange={set('carModel')}
              placeholder="e.g. Corolla"
              className={inputCls(errors.carModel)}
            />
            {errors.carModel && <p className="mt-1 text-xs text-danger">{errors.carModel}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-primary mb-1.5">Year</label>
          <div className="relative" style={{ maxWidth: '50%' }}>
            <select value={form.carYear} onChange={set('carYear')} className={selectCls(errors.carYear)}>
              <option value="">Select year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{'\u25BE'}</span>
          </div>
          {errors.carYear && <p className="mt-1 text-xs text-danger">{errors.carYear}</p>}
        </div>
      </SectionCard>

      {/* Color */}
      <SectionCard icon={<Palette size={14} />} title="Car color">
        <ColorSwatchGrid value={form.carColor} onChange={(v) => setForm((f) => ({ ...f, carColor: v, carColorCustom: '' }))} error={errors.carColor} />
        {errors.carColor && <p className="mt-1 text-xs text-danger">{errors.carColor}</p>}
        {form.carColor === 'other' && (
          <input value={form.carColorCustom} onChange={set('carColorCustom')} placeholder={'Specify color\u2026'} className={inputCls(errors.carColorCustom) + ' mt-3'} />
        )}
        {errors.carColorCustom && <p className="mt-1 text-xs text-danger">{errors.carColorCustom}</p>}
      </SectionCard>

      {/* License plate */}
      <SectionCard icon={<Hash size={14} />} title="License plate">
        <div
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F1F5F9', border: `1px solid ${errors.plate ? '#E74C3C' : '#E2E8F0'}`, borderRadius: 14, padding: '12px 16px', direction: 'rtl' }}
        >
          {/* DOM: L1,L2,L3 → visually L1=rightmost in RTL (letters on right) */}
          <PlateLetterInput
            inputRef={plateL1Ref} value={form.plateL1} placeholder={'\u0623'} error={!!errors.plate && !form.plateL1}
            onChange={(v) => { setForm(f => ({ ...f, plateL1: v })); if (v) plateL2Ref.current?.focus(); }}
            onBackspace={() => {}}
          />
          <PlateLetterInput
            inputRef={plateL2Ref} value={form.plateL2} placeholder={'\u0628'} error={!!errors.plate && !form.plateL2}
            onChange={(v) => { setForm(f => ({ ...f, plateL2: v })); if (v) plateL3Ref.current?.focus(); }}
            onBackspace={() => plateL1Ref.current?.focus()}
          />
          <PlateLetterInput
            inputRef={plateL3Ref} value={form.plateL3} placeholder={'\u062C'} error={!!errors.plate && !form.plateL3}
            onChange={(v) => { setForm(f => ({ ...f, plateL3: v })); if (v) numRef.current?.focus(); }}
            onBackspace={() => plateL2Ref.current?.focus()}
          />
          <span style={{ color: '#CBD5E1', fontSize: 22, fontWeight: 700, userSelect: 'none', lineHeight: 1 }}>{'\u00B7'}</span>
          {/* Number on left (last in RTL DOM = leftmost visually) */}
          <input
            ref={numRef} type="text" inputMode="numeric" placeholder="1234"
            value={form.plateNumber} maxLength={4} autoComplete="off"
            onChange={(e) => handleNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !form.plateNumber) plateL3Ref.current?.focus(); }}
            style={{ width: 80, height: 52, textAlign: 'center', border: `1.5px solid ${errors.plate ? '#E74C3C' : form.plateNumber ? '#00C2A8' : '#D1D5DB'}`, borderRadius: 10, fontSize: 18, fontWeight: 700, color: '#0B1E3D', background: '#fff', outline: 'none', fontFamily: 'inherit', letterSpacing: '0.12em', transition: 'border-color 0.15s', boxShadow: form.plateNumber ? '0 0 0 3px #00C2A833' : 'none' }}
            aria-label="Plate number"
          />
        </div>
        {errors.plate && <p className="mt-2 text-xs text-danger">{errors.plate}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, maxWidth: 288 }}>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>{'\u2190'} number</span>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>Arabic letters {'\u2192'}</span>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Switch to Arabic keyboard to type the letters</p>
      </SectionCard>

      <div className="flex gap-3 mt-2">
        <button type="button" onClick={onBack} className="flex-1 h-12 rounded-lg text-sm font-medium border-[1.5px] border-[#D1D5DB] text-primary hover:border-primary/40 transition-colors">{'\u2190 Back'}</button>
        <button type="submit" className="flex-1 h-12 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: '#00C2A8', color: '#fff' }}>{'Continue \u2192'}</button>
      </div>
    </form>
  );
}