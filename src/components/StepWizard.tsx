import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import { Card, Button } from './ui';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  children?: ReactNode;
}

export default function StepWizard({ steps, currentStep, onStepClick, children }: StepWizardProps) {
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <Card elevation="raised" className="px-4 sm:px-6 py-3 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, idx) => {
            const status = idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'inactive';
            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => onStepClick?.(idx)}
                  disabled={idx > currentStep}
                  className={`flex flex-col items-center gap-1 group cursor-pointer ${idx > currentStep ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className={`step-dot ${
                    status === 'completed' ? 'completed' :
                    status === 'active' ? 'active' : 'inactive'
                  }`}>
                    {status === 'completed' ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="hidden sm:block text-center">
                    <div className={`text-[9px] font-bold font-mono uppercase tracking-wider ${
                      status === 'active' ? 'text-brand' :
                      status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-muted'
                    }`}>{step.label}</div>
                    {step.description && (
                      <div className="text-[8px] text-ink-muted mt-0.5">{step.description}</div>
                    )}
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`step-line ${idx < currentStep ? 'completed' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function StepCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Card elevation="raised" className={`p-5 shadow-xs ${className}`}>
      {children}
    </Card>
  );
}

export function StepSection({ title, description, children }: {
  title: string; description?: string; children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {description && <p className="text-[11px] text-ink-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function StepActions({ onBack, onNext, nextLabel = 'Continue', disableNext }: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; disableNext?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
      {onBack ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          Back
        </Button>
      ) : <div />}
      {onNext && (
        <Button
          variant="primary"
          size="sm"
          onClick={onNext}
          disabled={disableNext}
          iconRight={ArrowRight}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
