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
    <div >
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center space-x-2"
        >
          <ChevronLeft size={16} />
          <span>{t("common.previous")}</span>
        </Button>

        {currentStep < totalSteps ? (
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            <span>{t("common.next")}</span>
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleCreateProject}
            disabled={!isFormValid || isCreating}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
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
