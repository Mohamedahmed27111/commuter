'use client';

import { useEffect, useRef, useState } from 'react';
import { RaiseOption, DriverCycleRequest } from '@/types/driver';
import { X } from 'lucide-react';

interface RaisePriceModalProps {
  request: DriverCycleRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (requestId: string, newPrice: number) => void;
}

const PCT_OPTIONS: Extract<RaiseOption, number>[] = [5, 10, 15];

export default function RaisePriceModal({
  request,
  isOpen,
  onClose,
  onConfirm,
}: RaisePriceModalProps) {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [error, setError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const basePrice = request?.base_price ?? 0;
  const maxAllowed = basePrice * 1.5;
  const estimatedMin = request?.estimated_price_min ?? basePrice;
  const estimatedMax = request?.estimated_price_max ?? maxAllowed;

  const parsedCustom = parseFloat(customInput);
  const newPrice = isNaN(parsedCustom) ? 0 : parsedCustom;
  const isValidPrice =
    !isNaN(parsedCustom) &&
    parsedCustom >= basePrice &&
    parsedCustom <= maxAllowed;

  useEffect(() => {
    if (isOpen) {
      setSelectedPct(null);
      setCustomInput('');
      setError('');
      setTimeout(() => closeRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  function handlePctClick(pct: number) {
    const calculated = parseFloat((basePrice * (1 + pct / 100)).toFixed(2));
    setSelectedPct(pct);
    setCustomInput(String(calculated));
    setError('');
  }

  function handleCustomChange(val: string) {
    // Only allow positive numbers with up to 2 decimal places
    if (val !== '' && !/^\d+(\.\d{0,2})?$/.test(val)) return;
    setSelectedPct(null);
    setCustomInput(val);

    const parsed = parseFloat(val);
    if (val !== '' && !isNaN(parsed)) {
      if (parsed < basePrice) {
        setError(`Minimum price is EGP ${basePrice.toFixed(2)}`);
      } else if (parsed > maxAllowed) {
        setError(`Maximum allowed is EGP ${maxAllowed.toFixed(2)} (+50%)`);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }

  function handleConfirm() {
    if (!isValidPrice) {
      inputRef.current?.focus();
      return;
    }
    onConfirm(request!.id, newPrice);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="raise-modal-title"
    >
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id="raise-modal-title" className="text-primary font-bold text-lg">
            Raise price for this cycle
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="text-text-muted hover:text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-1"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          <p className="text-sm text-text-muted">
            Base price:{' '}
            <span className="text-primary font-bold text-base">EGP {basePrice.toFixed(2)}</span>
          </p>

          {/* Price context */}
          <div style={{ background: '#EFF7F6', borderRadius: 10, padding: '12px 14px', fontSize: 13, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: '#5A6A7A', marginBottom: 2 }}>Est. range (passenger sees)</div>
              <div style={{ fontWeight: 700, color: '#0B1E3D' }}>EGP {estimatedMin} – {estimatedMax} / wk</div>
            </div>
            {newPrice > estimatedMax && (
              <div style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', borderRadius: 6, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                ⚠️ Exceeds passenger&apos;s estimate
              </div>
            )}
          </div>

          {/* Percentage buttons */}
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium">Quick raise</p>
            <div className="flex gap-2" role="group" aria-label="Percentage raise options">
              {PCT_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePctClick(pct)}
                  className={[
                    'flex-1 py-2 rounded-md border text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                    selectedPct === pct
                      ? 'bg-secondary text-white border-secondary'
                      : 'border-secondary text-secondary hover:bg-secondary-lt',
                  ].join(' ')}
                  aria-pressed={selectedPct === pct}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-text-muted">or enter custom price</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Custom input */}
          <div>
            <label htmlFor="custom-price" className="block text-xs font-medium text-text-muted mb-1">
              New price (EGP)
            </label>
            <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-secondary border-gray-200">
              <span className="px-3 py-2 bg-secondary-lt text-primary font-medium text-sm border-r border-gray-200">
                EGP
              </span>
              <input
                id="custom-price"
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={customInput}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder={basePrice.toFixed(2)}
                className="flex-1 px-3 py-2 text-primary text-sm outline-none bg-white"
                aria-describedby={error ? 'raise-price-error' : 'raise-price-hint'}
                aria-invalid={!!error}
              />
            </div>
            {error ? (
              <p id="raise-price-error" role="alert" className="mt-1 text-xs text-danger">{error}</p>
            ) : (
              <p id="raise-price-hint" className="mt-1 text-xs text-text-muted">
                Min: EGP {basePrice.toFixed(2)} · Max: EGP {maxAllowed.toFixed(2)}
              </p>
            )}
          </div>


        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-200 text-text-muted text-sm font-medium hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidPrice}
            className="px-4 py-2 rounded-md bg-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary transition-colors"
          >
            Confirm raise
          </button>
        </div>
      </div>
    </div>
  );
}
