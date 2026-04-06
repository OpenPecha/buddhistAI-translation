import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const stepKeys = ["projects.details", "projects.method", "projects.configure"] as const;

// Step indicator component
export function StepIndicator({
  currentStep,
  totalSteps,
}: {
  readonly currentStep: number;
  readonly totalSteps: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isCompleted &&
                    "bg-green-600 text-white shadow-sm dark:bg-green-600",
                  isActive &&
                    "bg-green-50 text-green-700 ring-2 ring-green-600 dark:bg-green-950 dark:text-green-400 dark:ring-green-500",
                  !isActive &&
                    !isCompleted &&
                    "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors duration-300",
                  isActive && "text-green-700 dark:text-green-400",
                  isCompleted && "text-neutral-600 dark:text-neutral-400",
                  !isActive &&
                    !isCompleted &&
                    "text-neutral-400 dark:text-neutral-500"
                )}
              >
                {t(stepKeys[index] ?? "")}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300",
                  isCompleted
                    ? "bg-green-500"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
