import { cn } from "@/lib/utils";

// Helper function for step indicator styling
function getStepIndicatorClass(step: number, currentStep: number): string {
  if (step === currentStep) {
    return "bg-green-100 text-green-500 border-green-600 dark:bg-green-900 dark:text-green-400 dark:border-green-600";
  } else if (step < currentStep) {
    return "bg-green-600 text-white border-green-600 dark:bg-green-900 dark:text-green-400 dark:border-green-600";
  } else {
    return "bg-white text-gray-500 border-gray-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700";
  }
}

// Step indicator component
export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  readonly currentStep: number;
  readonly totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs  transition-all duration-300 border-2",
              getStepIndicatorClass(index + 1, currentStep)
            )}
          >
            {index + 1 < currentStep ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "w-10 h-0.5  transition-colors duration-300",
                index + 1 < currentStep ? "bg-green-500" : "bg-gray-300 dark:bg-neutral-700 dark:border-neutral-600"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
