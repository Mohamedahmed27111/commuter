'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export interface Step2Data {
  province:    string;
  district:    string;
  sub_district: string;
  building:    string;
  street:      string;
  landmark:    string;
}

interface Step2Props {
  initial:    Partial<Step2Data>;
  loading:    boolean;
  onBack:     () => void;
  onSubmit:   (data: Step2Data) => void;
}

// ── Helpers (outside component to avoid remount-on-render) ────────────────────

function fieldCls(err?: string) {
  return [
    'w-full h-[52px] border rounded-lg text-sm bg-white px-4',
    'focus:outline-none transition-all placeholder:text-[#9CA3AF]',
    err
      ? 'border-[#E74C3C] focus:border-[#E74C3C] focus:ring-2 focus:ring-[#E74C3C]/15 text-[#0B1E3D]'
      : 'border-[#D1D5DB] focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/15 text-[#0B1E3D]',
  ].join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Step2Address({ initial, loading, onBack, onSubmit }: Step2Props) {
  const [form, setForm] = useState<Step2Data>({
    province:    initial.province    ?? '',
    district:    initial.district    ?? '',
    sub_district: initial.sub_district ?? '',
    building:    initial.building    ?? '',
    street:      initial.street      ?? '',
    landmark:    initial.landmark    ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});

  const set = (k: keyof Step2Data) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const e: Partial<Record<keyof Step2Data, string>> = {};
    if (!form.province.trim())    e.province    = 'Province is required.';
    if (!form.district.trim())    e.district    = 'District is required.';
    if (!form.sub_district.trim()) e.sub_district = 'Sub-district is required.';
    if (!form.building.trim())    e.building    = 'Building is required.';
    if (!form.street.trim())      e.street      = 'Street is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

      {/* Province + District */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Province</label>
          <input
            value={form.province}
            onChange={set('province')}
            placeholder="Cairo"
            autoComplete="address-level1"
            className={fieldCls(errors.province)}
          />
          {errors.province && <p className="mt-1 text-xs text-[#E74C3C]">{errors.province}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">District</label>
          <input
            value={form.district}
            onChange={set('district')}
            placeholder="Nasr City"
            autoComplete="address-level2"
            className={fieldCls(errors.district)}
          />
          {errors.district && <p className="mt-1 text-xs text-[#E74C3C]">{errors.district}</p>}
        </div>
      </div>

      {/* Sub-district */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Sub-district / Zone</label>
        <input
          value={form.sub_district}
          onChange={set('sub_district')}
          placeholder="Zone 1"
          autoComplete="address-level3"
          className={fieldCls(errors.sub_district)}
        />
        {errors.sub_district && <p className="mt-1 text-xs text-[#E74C3C]">{errors.sub_district}</p>}
      </div>

      {/* Building + Street */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Building</label>
          <input
            value={form.building}
            onChange={set('building')}
            placeholder="10"
            autoComplete="address-line2"
            className={fieldCls(errors.building)}
          />
          {errors.building && <p className="mt-1 text-xs text-[#E74C3C]">{errors.building}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Street</label>
          <input
            value={form.street}
            onChange={set('street')}
            placeholder="Tayaran Street"
            autoComplete="address-line1"
            className={fieldCls(errors.street)}
          />
          {errors.street && <p className="mt-1 text-xs text-[#E74C3C]">{errors.street}</p>}
        </div>
      </div>

      {/* Landmark */}
      <div>
        <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">
          Landmark <span className="text-[#9CA3AF] font-normal">(optional)</span>
        </label>
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
            aria-hidden
          />
          <input
            value={form.landmark}
            onChange={set('landmark')}
            placeholder="near mall, opposite mosque…"
            autoComplete="off"
            className={`${fieldCls(undefined)} pl-10`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 h-[52px] rounded-lg text-sm font-semibold border border-[#D1D5DB] text-[#5A6A7A] bg-white transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] h-[52px] rounded-lg text-sm font-bold bg-[#00C2A8] text-[#0B1E3D] flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create account
        </button>
      </div>
    </form>
  );
}
