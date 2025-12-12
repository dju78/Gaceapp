import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
}

interface ProductTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProductTour({ steps, isOpen, onClose, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || currentStep >= steps.length) {
      setTargetElement(null);
      return;
    }

    const step = steps[currentStep];
    const element = document.querySelector(step.target) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const placement = step.placement || 'bottom';
      const padding = step.highlightPadding || 8;
      
      let top = 0;
      let left = 0;
      
      switch (placement) {
        case 'bottom':
          top = rect.bottom + padding + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'top':
          top = rect.top - padding - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - padding - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + padding + 20;
          break;
      }
      
      setTooltipPosition({ top, left });
    } else {
      console.warn(`Tour target not found: ${step.target}`);
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
    setCurrentStep(0);
  };

  const handleSkip = () => {
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const targetRect = targetElement?.getBoundingClientRect();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay with spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{
              pointerEvents: 'none',
            }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/60" />
            
            {/* Spotlight cutout */}
            {targetRect && (
              <div
                className="absolute bg-transparent"
                style={{
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
                  top: targetRect.top - (step.highlightPadding || 8),
                  left: targetRect.left - (step.highlightPadding || 8),
                  width: targetRect.width + (step.highlightPadding || 8) * 2,
                  height: targetRect.height + (step.highlightPadding || 8) * 2,
                  borderRadius: '12px',
                  border: '2px solid #00d9ff',
                  animation: 'pulse-border 2s infinite',
                }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999] backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-purple-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              transform: step.placement === 'bottom' || step.placement === 'top' 
                ? 'translateX(-50%)' 
                : step.placement === 'right' 
                  ? 'translateY(-50%)' 
                  : 'translate(-100%, -50%)',
              maxWidth: '400px',
              width: 'max-content',
              pointerEvents: 'auto',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-6">
              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 text-sm">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-white mb-2">{step.title}</h3>
              <p className="text-white/70 mb-6 text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSkip}
                  className="text-white/60 hover:text-white text-sm transition-all"
                >
                  Skip Tour
                </button>
                
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-lg transition-all"
                  >
                    {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <style>{`
            @keyframes pulse-border {
              0%, 100% {
                border-color: #00d9ff;
                box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
              }
              50% {
                border-color: #a855f7;
                box-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

// Preset tour configurations
export const DASHBOARD_TOUR: TourStep[] = [
  {
    target: '[data-tour="welcome"]',
    title: 'Welcome to GACE',
    description: 'Your Global Asset Compliance Engine - the intelligent platform that helps UK residents manage tax compliance for overseas assets with AI-powered insights.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="global-scanner"]',
    title: 'Global Asset Scanner',
    description: 'This AI-powered scanner automatically analyzes your overseas assets and identifies compliance obligations across multiple jurisdictions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="compliance-alerts"]',
    title: 'Real-time Compliance Alerts',
    description: 'Get instant notifications about upcoming deadlines, regulatory changes, and compliance requirements specific to your asset portfolio.',
    placement: 'left',
  },
  {
    target: '[data-tour="tax-calculator"]',
    title: 'UK Tax Calculator',
    description: 'Calculate your UK tax liability considering Double Taxation Agreements (DTAs) across multiple countries. Our AI engine interprets complex tax treaties automatically.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="documents"]',
    title: 'Document Processing',
    description: 'Upload tax documents, property deeds, and financial statements. Our OCR technology extracts key data automatically to populate your asset registry.',
    placement: 'bottom',
  },
];

export const ASSET_TOUR: TourStep[] = [
  {
    target: '[data-tour="asset-list"]',
    title: 'Your Asset Portfolio',
    description: 'View all your overseas assets in one place. Each asset shows its current value, location, and compliance status.',
    placement: 'top',
  },
  {
    target: '[data-tour="add-asset"]',
    title: 'Add New Assets',
    description: 'Easily add new overseas properties, investments, pensions, or business interests. The system will automatically identify relevant tax obligations.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="asset-details"]',
    title: 'Detailed Asset Information',
    description: 'Click on any asset to see full details including acquisition date, current valuation, ownership percentage, and tax paid locally.',
    placement: 'left',
  },
];

export const TAX_CALCULATOR_TOUR: TourStep[] = [
  {
    target: '[data-tour="calculator-intro"]',
    title: 'AI-Powered Tax Calculator',
    description: 'Our intelligent calculator considers UK tax rates, Double Taxation Agreements, and foreign tax credits to give you accurate liability estimates.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="income-input"]',
    title: 'Enter Your Income',
    description: 'Input both UK and foreign income sources. The system will automatically apply the correct tax treatment for each jurisdiction.',
    placement: 'right',
  },
  {
    target: '[data-tour="dta-relief"]',
    title: 'DTA Relief Calculation',
    description: 'See how much tax relief you can claim under Double Taxation Agreements. This prevents you from being taxed twice on the same income.',
    placement: 'left',
  },
  {
    target: '[data-tour="results"]',
    title: 'Your Results',
    description: 'View your total UK tax liability, foreign tax credits, and net amount owed. Export this for your tax advisor or HMRC submission.',
    placement: 'top',
  },
];

// Hook to manage tour state
export function useTour(tourSteps: TourStep[]) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Check if user has completed this tour before
  useEffect(() => {
    const tourKey = `tour_completed_${tourSteps[0]?.target || 'default'}`;
    const completed = localStorage.getItem(tourKey) === 'true';
    setHasCompletedTour(completed);
  }, [tourSteps]);

  const startTour = () => {
    setIsTourOpen(true);
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const completeTour = () => {
    const tourKey = `tour_completed_${tourSteps[0]?.target || 'default'}`;
    localStorage.setItem(tourKey, 'true');
    setHasCompletedTour(true);
    setIsTourOpen(false);
  };

  const resetTour = () => {
    const tourKey = `tour_completed_${tourSteps[0]?.target || 'default'}`;
    localStorage.removeItem(tourKey);
    setHasCompletedTour(false);
  };

  return {
    isTourOpen,
    hasCompletedTour,
    startTour,
    closeTour,
    completeTour,
    resetTour,
  };
}

// Floating tour button component
interface TourButtonProps {
  onClick: () => void;
  label?: string;
}

export function TourButton({ onClick, label = 'Start Tour' }: TourButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all"
    >
      <Play className="w-4 h-4" />
      {label}
    </button>
  );
}
