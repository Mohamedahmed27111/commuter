'use client';

import { useState } from 'react';

export interface Step3CarData {
  national_id:    string;
  license_expiry: string;
  car_type:       string;
  car_brand:      string;
  car_model:      string;
  car_year:       string;
  car_color:      string;
  license_plate:  string;
  location_name:  string;
}

interface Props {
  initial:  Partial<Step3CarData>;
  onNext:   (data: Step3CarData) => void;
  onBack:   () => void;
  loading?: boolean;
}

function fieldCls(err?: string) {
  return [
    'w-full h-[52px] border rounded-lg text-sm bg-white px-4',
    'focus:outline-none transition-all placeholder:text-[#9CA3AF]',
    err
      ? 'border-[#E74C3C] focus:border-[#E74C3C] focus:ring-2 focus:ring-[#E74C3C]/15 text-[#0B1E3D]'
      : 'border-[#D1D5DB] focus:border-[#00C2A8] focus:ring-2 focus:ring-[#00C2A8]/15 text-[#0B1E3D]',
  ].join(' ');
}

function selectCls(err?: string) {
  return `${fieldCls(err)} appearance-none`;
}

export default function Step3CarDetails({ initial, onNext, onBack, loading }: Props) {
  const [form, setForm] = useState<Step3CarData>({
    national_id:    initial.national_id    ?? '',
    license_expiry: initial.license_expiry ?? '',
    car_type:       initial.car_type       ?? '',
    car_brand:      initial.car_brand      ?? '',
    car_model:      initial.car_model      ?? '',
    car_year:       initial.car_year       ?? '',
    car_color:      initial.car_color      ?? '',
    license_plate:  initial.license_plate  ?? '',
    location_name:  initial.location_name  ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step3CarData, string>>>({});

  const set = (k: keyof Step3CarData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): boolean {
    const e: Partial<Record<keyof Step3CarData, string>> = {};
    if (!/^\d{14}$/.test(form.national_id)) e.national_id = 'National ID must be exactly 14 digits.';
    if (!form.license_expiry) e.license_expiry = 'License expiry date is required.';
    if (!form.car_type) e.car_type = 'Please select a car type.';
    if (!form.car_brand.trim()) e.car_brand = 'Car brand is required.';
    if (!form.car_model.trim()) e.car_model = 'Car model is required.';
    if (!form.car_year || isNaN(Number(form.car_year))) e.car_year = 'Valid car year is required.';
    if (!form.car_color.trim()) e.car_color = 'Car color is required.';
    if (!form.license_plate.trim()) e.license_plate = 'License plate is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-2 gap-4">

        {/* National ID */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">National ID</label>
          <input
            value={form.national_id}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && e.target.value.length <= 14)
                set('national_id')(e);
            }}
            placeholder="14-digit National ID"
            inputMode="numeric"
            className={fieldCls(errors.national_id)}
          />
          {errors.national_id && <p className="mt-1 text-xs text-[#E74C3C]">{errors.national_id}</p>}
        </div>

        {/* License expiry */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">License expiry</label>
          <input type="date" value={form.license_expiry} onChange={set('license_expiry')} className={fieldCls(errors.license_expiry)} />
          {errors.license_expiry && <p className="mt-1 text-xs text-[#E74C3C]">{errors.license_expiry}</p>}
        </div>

        {/* Car type */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Car type</label>
          <select value={form.car_type} onChange={set('car_type')} className={selectCls(errors.car_type)}>
            <option value="">Select type</option>
            <option value="private">Private</option>
            <option value="taxi">Taxi</option>
          </select>
          {errors.car_type && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_type}</p>}
        </div>

        {/* Car brand */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Car brand</label>
          <input type="text" value={form.car_brand} onChange={set('car_brand')} placeholder="e.g. Toyota" className={fieldCls(errors.car_brand)} />
          {errors.car_brand && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_brand}</p>}
        </div>

        {/* Car model */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Car model</label>
          <input type="text" value={form.car_model} onChange={set('car_model')} placeholder="e.g. Corolla" className={fieldCls(errors.car_model)} />
          {errors.car_model && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_model}</p>}
        </div>

        {/* Car year */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Car year</label>
          <input
            type="number" min={1990} max={2030}
            value={form.car_year} onChange={set('car_year')}
            placeholder="e.g. 2020" className={fieldCls(errors.car_year)}
          />
          {errors.car_year && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_year}</p>}
        </div>

        {/* Car color */}
        <div>
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">Car color</label>
          <input type="text" value={form.car_color} onChange={set('car_color')} placeholder="e.g. White" className={fieldCls(errors.car_color)} />
          {errors.car_color && <p className="mt-1 text-xs text-[#E74C3C]">{errors.car_color}</p>}
        </div>

        {/* License plate */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">License plate</label>
          <input type="text" value={form.license_plate} onChange={set('license_plate')} placeholder="e.g. أ ب ج 1234" className={fieldCls(errors.license_plate)} />
          {errors.license_plate && <p className="mt-1 text-xs text-[#E74C3C]">{errors.license_plate}</p>}
        </div>

        {/* Default pickup area (optional) */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-[#0B1E3D] mb-1.5">
            Default pickup area <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </label>
          <input
            type="text" value={form.location_name} onChange={set('location_name')}
            placeholder="e.g. Nasr City, Cairo" className={fieldCls()}
          />
        </div>

      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 h-12 rounded-xl border border-[#D1D5DB] bg-white text-[#5A6A7A] text-sm font-bold transition-opacity disabled:opacity-50 cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] h-12 rounded-xl bg-[#00C2A8] text-[#0B1E3D] text-sm font-bold disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
