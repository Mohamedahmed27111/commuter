'use client';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  completedUpTo: number; // highest completed step
}

const STEPS = [
  { n: 1 as const, label: 'Personal' },
  { n: 2 as const, label: 'Car Info' },
  { n: 3 as const, label: 'Documents' },
];

export default function StepIndicator({ currentStep, onStepClick, completedUpTo }: StepIndicatorProps) {
  return (
    <div className="flex items-center mb-8" role="list" aria-label="Sign-up progress">
      {STEPS.map((step, idx) => {
        const completed = step.n < currentStep || step.n <= completedUpTo;
        const active    = step.n === currentStep;
        const clickable = completed && onStepClick;

        return (
          <div key={step.n} className="flex items-center flex-1 last:flex-none" role="listitem">
            {/* Circle */}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step.n)}
              className={[
                'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-xs font-bold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1',
                completed
                  ? 'bg-secondary border-secondary text-primary cursor-pointer'
                  : active
                  ? 'bg-white border-secondary text-secondary shadow-[0_0_0_3px_rgba(0,194,168,0.2)]'
                  : 'bg-white border-[#D1D5DB] text-text-muted cursor-default',
              ].join(' ')}
              aria-current={active ? 'step' : undefined}
              aria-label={`Step ${step.n}: ${step.label}${completed ? ' (completed)' : active ? ' (current)' : ''}`}
            >
              {completed ? (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : active ? (
                <div className="w-2 h-2 rounded-full bg-secondary" />
              ) : (
                step.n
              )}
            </button>

            {/* Label */}
            <span
              className={[
                'ml-1.5 text-xs whitespace-nowrap',
                active ? 'text-primary font-semibold' : completed ? 'text-secondary font-medium' : 'text-text-muted',
              ].join(' ')}
            >
              {step.label}
            </span>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-0.5 rounded-full" style={{ background: completed ? '#00C2A8' : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
