import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentCreateModalContext } from "@/contexts/DocumentCreateModalContext";

export const ModalNavigation = React.memo(() => {
  const { t } = useTranslation();
  const {
    state,
    totalSteps,
    handlePrevious,
    handleNext,
    canGoNext,
    handleCreateProject
  } = useDocumentCreateModalContext();
  const { currentStep, isFormValid, isCreating } = state;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-2">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          <span>{t("common.previous")}</span>
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-40"
          >
            <span>{t("common.next")}</span>
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleCreateProject}
            disabled={!isFormValid || isCreating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-40"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t("common.creating")}</span>
              </>
            ) : (
              <span>{t("modal.createProject")}</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});

ModalNavigation.displayName = "ModalNavigation";
