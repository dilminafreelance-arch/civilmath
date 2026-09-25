import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';

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
      <div className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl px-4 sm:px-6 py-3 shadow-xs">
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
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${
                      status === 'active' ? 'text-[#f97316]' :
                      status === 'completed' ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                    }`}>{step.label}</div>
                    {step.description && (
                      <div className="text-[7px] text-[#94A3B8] mt-0.5">{step.description}</div>
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
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
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
    <div className={`bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-5 shadow-xs ${className}`}>
      {children}
    </div>
  );
}

export function StepSection({ title, description, children }: {
  title: string; description?: string; children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-[#0F172A] dark:text-[#F1F5F9]">{title}</h3>
        {description && <p className="text-[11px] text-[#64748B] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function StepActions({ onBack, onNext, nextLabel = 'Continue', disableNext }: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; disableNext?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
      <button onClick={onBack}
        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          onBack ? 'text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]' : 'invisible'
        }`}>
        Back
      </button>
      {onNext && (
        <button onClick={onNext} disabled={disableNext}
          className="btn-primary text-xs px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {nextLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
