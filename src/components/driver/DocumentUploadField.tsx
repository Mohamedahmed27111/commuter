'use client';

import { useRef, useState } from 'react';
import { DriverDocuments } from '@/types/driver';
import Image from 'next/image';
import { Upload, FileText, Eye, RefreshCw } from 'lucide-react';

interface DocumentUploadFieldProps {
  label: string;
  fieldName: keyof DriverDocuments;
  currentUrl: string | null;
  onUpload: (fieldName: keyof DriverDocuments, file: File) => Promise<void>;
  acceptedTypes?: string;
  maxSizeMb?: number;
}

type FieldState = 'empty' | 'has-file' | 'uploading' | 'error';

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf');
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export default function DocumentUploadField({
  label,
  fieldName,
  currentUrl,
  onUpload,
  acceptedTypes = 'image/jpeg,image/png,application/pdf',
  maxSizeMb = 5,
}: DocumentUploadFieldProps) {
  const [state, setFieldState] = useState<FieldState>(currentUrl ? 'has-file' : 'empty');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setErrorMsg('');

    if (!acceptedTypes.split(',').some((t) => file.type === t.trim())) {
      setFieldState('error');
      setErrorMsg(`Invalid file type. Accepted: JPG, PNG, PDF`);
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setFieldState('error');
      setErrorMsg(`File exceeds maximum size of ${maxSizeMb}MB`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    setFieldState('uploading');
    setProgress(0);

    // Simulate progress for better UX while uploading
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 90));
    }, 150);

    try {
      await onUpload(fieldName, file);
      clearInterval(interval);
      setProgress(100);
      setFieldState('has-file');
    } catch (e) {
      clearInterval(interval);
      setFieldState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const inputId = `doc-upload-${fieldName}`;
  const errorId = `doc-error-${fieldName}`;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-primary">
        {label}
      </label>

      {/* Empty state */}
      {(state === 'empty' || state === 'error') && (
        <div
          className={[
            'relative border-2 border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
            state === 'error'
              ? 'border-danger bg-red-50'
              : 'border-[#C8E8E4] bg-secondary-lt hover:border-secondary',
          ].join(' ')}
        style={{ minHeight: 160 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label={`Upload ${label}`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        >
          <Upload size={24} className={state === 'error' ? 'text-danger' : 'text-secondary'} aria-hidden="true" />
          <p className="text-sm font-medium text-primary">Upload {label}</p>
          <p className="text-xs text-text-muted">JPG, PNG, PDF — max {maxSizeMb}MB</p>
        </div>
      )}

      {/* Has file state */}
      {state === 'has-file' && previewUrl && (
        <div className="border border-[#C8E8E4] rounded-md overflow-hidden bg-secondary-lt">
          {isImage(previewUrl) ? (
            <div className="relative h-36 w-full">
              <Image
                src={previewUrl}
                alt={`Uploaded ${label}`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 400px) 100vw, 400px"
              />
            </div>
          ) : isPdf(previewUrl) ? (
            <div className="h-24 flex items-center justify-center gap-3 px-4">
              <FileText size={32} className="text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">{label}</span>
            </div>
          ) : null}
          <div className="flex gap-2 px-3 py-2 border-t border-[#C8E8E4]">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-secondary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
            >
              <Eye size={13} aria-hidden="true" /> View
            </a>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-text-muted font-medium hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
            >
              <RefreshCw size={13} aria-hidden="true" /> Replace
            </button>
          </div>
        </div>
      )}

      {/* Has file but no preview (e.g. remote URL without extension) */}
      {state === 'has-file' && !previewUrl && (
        <div className="border border-[#C8E8E4] rounded-md p-4 flex items-center justify-between bg-secondary-lt">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary" aria-hidden="true" />
            <span className="text-sm text-primary font-medium">{label}</span>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
          >
            <RefreshCw size={13} aria-hidden="true" /> Replace
          </button>
        </div>
      )}

      {/* Uploading state */}
      {state === 'uploading' && (
        <div className="border border-[#C8E8E4] rounded-md p-5 bg-secondary-lt space-y-2">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Upload size={16} aria-hidden="true" />
            Uploading {label}…
          </div>
          <div
            className="h-2 rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${progress}%`}
          >
            <div
              className="h-full bg-secondary transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {state === 'error' && errorMsg && (
        <p id={errorId} role="alert" className="text-xs text-danger mt-1">
          {errorMsg}
        </p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={acceptedTypes}
        onChange={handleInputChange}
        className="sr-only"
        aria-describedby={state === 'error' ? errorId : undefined}
        tabIndex={-1}
      />
    </div>
  );
}
