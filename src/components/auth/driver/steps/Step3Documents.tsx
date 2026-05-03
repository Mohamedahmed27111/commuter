'use client';

import { useState } from 'react';
import { Loader2, User, CreditCard, Shield, FileCheck, CheckCircle, Info } from 'lucide-react';
import DocumentUploadField from '@/components/auth/driver/DocumentUploadField';

export interface Step3Data {
  profilePhoto: File | null;
  nationalIdFront: File | null;
  nationalIdBack: File | null;
  drivingLicense: File | null;
  carLicense: File | null;
  criminalRecord: File | null;
}

interface Step3Props {
  email: string;
  onBack: () => void;
  onSubmit: (docs: Step3Data) => Promise<void>;
}

const IMG_PDF = 'image/jpeg,image/png,application/pdf';

type DocField = {
  key: keyof Step3Data;
  label: string;
  accept: string;
  maxMB: number;
  note?: string;
};

type DocGroup = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  fields: DocField[];
};

export default function Step3Documents({ email, onBack, onSubmit }: Step3Props) {
  const [docs, setDocs] = useState<Step3Data>({
    profilePhoto:    null,
    nationalIdFront: null,
    nationalIdBack:  null,
    drivingLicense:  null,
    carLicense:      null,
    criminalRecord:  null,
  });
  const [loading, setLoading] = useState(false);

  function setDoc(key: keyof Step3Data) {
    return (file: File | null) => setDocs((d) => ({ ...d, [key]: file }));
  }

  const totalDocs = Object.keys(docs).length;
  const uploadedCount = Object.values(docs).filter(Boolean).length;
  const allUploaded = uploadedCount === totalDocs;
  const progressPct = Math.round((uploadedCount / totalDocs) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allUploaded) return;
    setLoading(true);
    await onSubmit(docs);
    setLoading(false);
  }

  const GROUPS: DocGroup[] = [
    {
      id: 'photo',
      icon: <User size={15} />,
      title: 'Profile photo',
      subtitle: 'A clear face photo',
      fields: [
        { key: 'profilePhoto', label: 'Profile photo', accept: 'image/jpeg,image/png', maxMB: 3 },
      ],
    },
    {
      id: 'identity',
      icon: <CreditCard size={15} />,
      title: 'National ID',
      subtitle: 'Both sides required',
      fields: [
        { key: 'nationalIdFront', label: 'National ID \u2014 Front', accept: IMG_PDF, maxMB: 5 },
        { key: 'nationalIdBack',  label: 'National ID \u2014 Back',  accept: IMG_PDF, maxMB: 5 },
      ],
    },
    {
      id: 'licenses',
      icon: <Shield size={15} />,
      title: 'Licenses',
      subtitle: 'Driving & vehicle licenses',
      fields: [
        { key: 'drivingLicense', label: 'Driving license', accept: IMG_PDF, maxMB: 5 },
        { key: 'carLicense',     label: 'Car license',     accept: IMG_PDF, maxMB: 5 },
      ],
    },
    {
      id: 'clearance',
      icon: <FileCheck size={15} />,
      title: 'Criminal clearance',
      subtitle: 'Issued within 3 months',
      fields: [
        { key: 'criminalRecord', label: 'Criminal Record Certificate', accept: IMG_PDF, maxMB: 5, note: 'Must be issued within the last 3 months.' },
      ],
    },
  ];

  const groupDone = (g: DocGroup) => g.fields.every((f) => !!docs[f.key]);
  const groupCount = (g: DocGroup) => g.fields.filter((f) => !!docs[f.key]).length;

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: '#5A6A7A' }}>
            {uploadedCount === 0
              ? 'No documents uploaded yet'
              : uploadedCount < totalDocs
                ? `${uploadedCount} of ${totalDocs} uploaded`
                : '\u2713 All documents ready'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: allUploaded ? '#00C2A8' : '#0B1E3D' }}>{progressPct}%</span>
        </div>
        <div style={{ height: 5, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: allUploaded ? '#00C2A8' : '#0B1E3D', borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {GROUPS.map((g) => {
            const done = groupDone(g);
            const partial = groupCount(g) > 0 && !done;
            return (
              <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#00C2A8' : partial ? '#EFF7F6' : '#F1F5F9', border: done ? '2px solid #00C2A8' : partial ? '2px solid #00C2A8' : '2px solid #E2E8F0', transition: 'all 0.2s' }}>
                  {done
                    ? <CheckCircle size={14} color="#fff" />
                    : <span style={{ color: partial ? '#00C2A8' : '#9CA3AF', display: 'flex' }}>{g.icon}</span>
                  }
                </div>
                <span style={{ fontSize: 9, color: done ? '#00C2A8' : '#9CA3AF', fontWeight: done ? 600 : 400, textAlign: 'center', maxWidth: 60, lineHeight: 1.2 }}>{g.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GROUPS.map((group) => {
          const done = groupDone(group);
          const partial = groupCount(group) > 0 && !done;
          const borderColor = done ? '#00C2A8' : partial ? '#00C2A855' : '#E2E8F0';
          const headerBg = done ? '#EFF7F6' : '#F8F9FA';
          return (
            <div key={group.id} style={{ border: `1.5px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: headerBg, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: done ? '#00C2A8' : '#fff', border: done ? 'none' : '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: done ? '#fff' : '#5A6A7A', display: 'flex', alignItems: 'center' }}>{group.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: done ? '#00C2A8' : '#0B1E3D' }}>{group.title}</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{group.subtitle}</span>
                </div>
                {done ? (
                  <CheckCircle size={16} color="#00C2A8" />
                ) : (
                  <span style={{ fontSize: 11, color: partial ? '#00C2A8' : '#9CA3AF', background: '#fff', border: `1px solid ${partial ? '#00C2A844' : '#E2E8F0'}`, borderRadius: 99, padding: '2px 9px', fontWeight: partial ? 600 : 400 }}>
                    {groupCount(group)}/{group.fields.length}
                  </span>
                )}
              </div>

              {/* Upload area */}
              <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: group.fields.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                {group.fields.map((f) => (
                  <DocumentUploadField
                    key={f.key}
                    fieldKey={f.key}
                    label={f.label}
                    accept={f.accept}
                    maxSizeMB={f.maxMB}
                    note={f.note}
                    value={docs[f.key]}
                    onChange={setDoc(f.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice */}
      <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0FDF9', border: '1px solid #00C2A833', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={14} style={{ color: '#00C2A8', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: '#5A6A7A', margin: 0, lineHeight: 1.6 }}>
          Your account will be reviewed within <strong style={{ color: '#0B1E3D' }}>24\u201348 hours</strong>. All documents must be clear and legible.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onBack} disabled={loading}
          className="flex-1 h-12 rounded-lg text-sm font-medium border-[1.5px] border-[#D1D5DB] text-primary hover:border-primary/40 transition-colors disabled:opacity-50">
          {'\u2190 Back'}
        </button>
        <button type="submit" disabled={!allUploaded || loading}
          className="flex-[2] h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: allUploaded ? '#00C2A8' : '#E5E7EB', color: allUploaded ? '#fff' : '#9CA3AF', cursor: allUploaded && !loading ? 'pointer' : 'not-allowed' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {allUploaded
            ? 'Submit application'
            : `Upload ${totalDocs - uploadedCount} more document${totalDocs - uploadedCount !== 1 ? 's' : ''}`}
        </button>
      </div>

      <p className="sr-only">Submitting for {email}</p>
    </form>
  );
}