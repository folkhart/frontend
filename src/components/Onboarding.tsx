import { useState } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import villageIcon from '@/assets/ui/village.png';
import guildIcon from '@/assets/ui/guild.png';
import adventureIcon from '@/assets/ui/adventure.png';
import shopIcon from '@/assets/ui/shop.png';

interface OnboardingStep {
  title: string;
  description: string;
  icon?: string;
  position?: 'center' | 'bottom';
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: '🎮 Welcome to Folkhart!',
    description: 'A cozy fantasy idle RPG where you embark on epic adventures, fight monsters, and build your legend!',
    position: 'center',
  },
  {
    title: '🏘️ Village',
    description: 'Your home base! Manage your inventory, equip items, and prepare for adventures.',
    icon: villageIcon,
    position: 'bottom',
  },
  {
    title: '⚔️ Guild',
    description: 'Join forces with other players! Create or join guilds, chat, and compete together.',
    icon: guildIcon,
    position: 'bottom',
  },
  {
    title: '🗺️ Adventure',
    description: 'Explore dungeons, fight bosses, and earn rewards! Choose between Idle or Active runs.',
    icon: adventureIcon,
    position: 'bottom',
  },
  {
    title: '🛒 Shop',
    description: 'Buy powerful items, consumables, and upgrades to strengthen your character!',
    icon: shopIcon,
    position: 'bottom',
  },
  {
    title: '🎯 Ready to Start!',
    description: 'You\'re all set! Start your adventure and become a legend in Folkhart!',
    position: 'center',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
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
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = onboardingSteps[currentStep];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className={`bg-stone-800 border-4 border-amber-600 p-6 max-w-md w-full relative ${
          step.position === 'bottom' ? 'mb-20' : ''
        }`}
        style={{
          borderRadius: '0',
          boxShadow: '0 8px 0 rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        {step.icon && (
          <div className="flex justify-center mb-4">
            <img 
              src={step.icon} 
              alt={step.title} 
              className="w-20 h-20" 
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        )}

        {/* Content */}
        <h2 className="text-3xl font-bold text-amber-400 mb-4 text-center" style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}>
          {step.title}
        </h2>
        <p className="text-gray-300 text-center mb-6 text-lg leading-relaxed">
          {step.description}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-amber-400 w-6'
                  : index < currentStep
                  ? 'bg-amber-600'
                  : 'bg-stone-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold transition flex items-center justify-center gap-2"
              style={{
                border: '3px solid #57534e',
                borderRadius: '0',
                boxShadow: '0 3px 0 #44403c',
                textShadow: '1px 1px 0 #000',
                fontFamily: 'monospace',
              }}
            >
              <ChevronLeft size={20} />
              BACK
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold transition flex items-center justify-center gap-2"
            style={{
              border: '3px solid #92400e',
              borderRadius: '0',
              boxShadow: '0 3px 0 #b45309',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
            }}
          >
            {currentStep === onboardingSteps.length - 1 ? "LET'S GO!" : 'NEXT'}
            {currentStep < onboardingSteps.length - 1 && <ChevronRight size={20} />}
          </button>
        </div>

        {/* Step Counter */}
        <p className="text-center text-gray-500 text-sm mt-4" style={{ fontFamily: 'monospace' }}>
          Step {currentStep + 1} of {onboardingSteps.length}
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
