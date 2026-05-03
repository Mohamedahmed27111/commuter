'use client';

import { DriverSignupStep } from '@/types/auth';

const STEPS: DriverSignupStep[] = [
  { step: 1, label: 'Personal', description: 'Your personal information' },
  { step: 2, label: 'Car Info', description: 'Your vehicle details' },
  { step: 3, label: 'Documents', description: 'Upload required documents' },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Signup progress" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((s, idx) => {
          const isDone    = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isLast    = idx === STEPS.length - 1;

          return (
            <li key={s.step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              {/* Circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-200',
                    isDone
                      ? 'bg-secondary border-secondary'
                      : isCurrent
                      ? 'bg-primary border-secondary'
                      : 'bg-white border-gray-300',
                  ].join(' ')}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 7l4 4 6-6" stroke="#0B1E3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary block" />
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">{s.step}</span>
                  )}
                </div>
                <span
                  className={[
                    'text-xs font-medium whitespace-nowrap',
                    isDone || isCurrent ? 'text-primary' : 'text-text-muted',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={[
                    'h-0.5 flex-1 mx-2 mb-5 rounded transition-colors duration-200',
                    isDone ? 'bg-secondary' : 'bg-gray-200',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
