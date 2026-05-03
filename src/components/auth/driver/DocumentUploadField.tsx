'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface DocumentUploadFieldProps {
  label: string;
  fieldKey: string;
  accept: string; // e.g. "image/jpeg,image/png"
  maxSizeMB: number;
  note?: string; // extra note below label
  value: File | null;
  onChange: (file: File | null) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadField({
  label,
  accept,
  maxSizeMB,
  note,
  value,
  onChange,
}: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);

  const acceptedTypes = accept.split(',').map((a) => a.trim());

  function validate(file: File): string {
    if (!acceptedTypes.includes(file.type)) {
      const exts = accept.replace(/[a-z]+\//gi, '').replace(/jpeg/i, 'JPG').toUpperCase();
      return `Invalid file type. Accepted: ${exts}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return '';
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      onChange(null);
      return;
    }
    setError('');
    // Simulate progress
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 30 + 10;
      if (p >= 100) {
        clearInterval(interval);
        setProgress(null);
        onChange(file);
      } else {
        setProgress(Math.min(p, 95));
      }
    }, 80);
  }

  const isImage = value && value.type.startsWith('image/');
  const isPDF   = value && value.type === 'application/pdf';
  const preview = isImage ? URL.createObjectURL(value) : null;

  const borderStyle = error
    ? 'border-danger'
    : value
    ? 'border-success'
    : dragging
    ? 'border-secondary'
    : 'border-[#D1D5DB]';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        className={[
          'relative border-2 border-dashed rounded-xl transition-all',
          borderStyle,
          !value && !progress ? 'cursor-pointer hover:border-secondary/60' : '',
        ].join(' ')}
        style={{ flex: 1, minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        onClick={() => !value && !progress && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        role={!value && !progress ? 'button' : undefined}
        tabIndex={!value && !progress ? 0 : undefined}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={`Upload ${label}`}
      >
        {/* Required badge */}
        {!value && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold text-danger bg-danger/10 px-1.5 py-0.5 rounded">
            Required
          </span>
        )}

        {/* Uploaded checkmark — only when not image (image has overlay) */}
        {value && !isImage && (
          <div className="absolute top-2 right-2">
            <CheckCircle size={18} className="text-success" />
          </div>
        )}

        {/* Empty state */}
        {!value && !progress && (
          <div className="flex flex-col items-center justify-center gap-2 py-7 px-4 text-center">
            <Upload size={22} className="text-text-muted" />
            <p className="text-sm font-medium text-primary">{label}</p>
            <p className="text-[11px] text-text-muted">
              {accept.replace(/image\//g, '').replace(/application\//g, '').toUpperCase().split(',').join(', ')} · max {maxSizeMB}MB
            </p>
          </div>
        )}

        {/* Progress */}
        {progress !== null && (
          <div className="py-8 px-5 flex flex-col gap-3">
            <p className="text-sm font-medium text-primary">{label}</p>
            <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Uploaded: image — full cover, no filename */}
        {value && isImage && preview && (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 110, overflow: 'hidden', borderRadius: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 110 }}
            />
            {/* gradient overlay + label */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
              borderRadius: 10,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '8px 10px',
            }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
            </div>
            {/* replace button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); setError(''); }}
              style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 7px', backdropFilter: 'blur(4px)',
              }}
              aria-label={`Replace ${label}`}
            >
              <X size={11} /> Replace
            </button>
          </div>
        )}

        {/* Uploaded: PDF */}
        {value && isPDF && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '18px 12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF7F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} style={{ color: '#00C2A8' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0B1E3D', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
            <span style={{ fontSize: 10, color: '#00C2A8', fontWeight: 500 }}>PDF ready</span>
          </div>
        )}

        {/* Replace button for PDF */}
        {value && isPDF && (
          <button
            type="button"
            className="absolute bottom-2 right-2 text-[11px] text-text-muted hover:text-danger flex items-center gap-0.5 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(null); setError(''); }}
            aria-label={`Remove ${label}`}
          >
            <X size={12} /> Replace
          </button>
        )}
      </div>

      {note && !error && <p className="mt-1 text-[11px] text-text-muted">{note}</p>}
      {error && (
        <p className="mt-1 text-xs text-danger flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        aria-hidden="true"
      />
    </div>
  );
}
