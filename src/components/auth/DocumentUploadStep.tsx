'use client';

import { useRef, useState, DragEvent } from 'react';

export interface DocField {
  key: string;
  label: string;
  accept: string;
  maxMb: number;
  note?: string;
}

interface DocumentUploadStepProps {
  fields: DocField[];
  files: Record<string, File | null>;
  onChange: (key: string, file: File | null) => void;
}

export default function DocumentUploadStep({ fields, files, onChange }: DocumentUploadStepProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((f) => (
        <DocUploadBox
          key={f.key}
          field={f}
          file={files[f.key] ?? null}
          onFile={(file) => onChange(f.key, file)}
        />
      ))}
    </div>
  );
}

function DocUploadBox({ field, file, onFile }: { field: DocField; file: File | null; onFile: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  function validate(f: File): string {
    const allowed = field.accept.split(',').map((a) => a.trim());
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    const mime = f.type;
    const ok = allowed.some((a) => a === ext || a === mime || (a === 'image/*' && mime.startsWith('image/')));
    if (!ok) return `Unsupported file type. Accepted: ${field.accept}`;
    if (f.size > field.maxMb * 1024 * 1024) return `File too large (max ${field.maxMb} MB)`;
    return '';
  }

  function handleFile(f: File) {
    const err = validate(f);
    if (err) { setError(err); return; }
    setError('');
    onFile(f);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-primary">{field.label}</span>
        <span className="text-xs text-white bg-danger rounded-full px-2 py-0.5 font-semibold">Required</span>
      </div>
      {field.note && <p className="text-[11px] text-text-muted">{field.note}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'relative w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-center overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
          error ? 'border-danger bg-red-50'
            : dragging ? 'border-secondary bg-secondary-lt'
            : file ? 'border-success bg-green-50'
            : 'border-gray-300 bg-white hover:border-secondary hover:bg-secondary-lt',
        ].join(' ')}
        aria-label={`Upload ${field.label}`}
      >
        {file ? (
          <>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-60" />
            ) : (
              <svg className="w-8 h-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {/* Green checkmark overlay */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <svg className="w-8 h-8 text-success drop-shadow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs text-success font-semibold bg-white/80 px-2 rounded truncate max-w-[120px]">{file.name}</span>
              <span className="text-[10px] text-text-muted">Click to replace</span>
            </div>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-text-muted">Click or drag to upload</span>
            <span className="text-[10px] text-text-muted/70">{field.accept.replace(/,/g, ' / ')} · max {field.maxMb}MB</span>
          </>
        )}
      </button>

      {error && <p className="text-xs text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        onChange={onInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
