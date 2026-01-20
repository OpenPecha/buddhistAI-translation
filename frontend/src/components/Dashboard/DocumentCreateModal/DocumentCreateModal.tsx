import { useTranslation } from "react-i18next";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { StepIndicator } from "./StepIndicator";
import { StepRenderer } from "./StepRenderer";
import { ModalNavigation } from "./ModalNavigation";

import {
  DocumentCreateModalProvider,
  useDocumentCreateModalContext,
} from "@/contexts/DocumentCreateModalContext";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
function DocumentCreateModalContent() {
  const { t } = useTranslation();
  const { state, totalSteps, handleModalOpenChange, handleCreateButtonClick } =
    useDocumentCreateModalContext();

  const trigger = (
    <div className="flex-shrink-0 cursor-pointer group">
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="h-full w-fit border-dashed cursor-pointer"
          onClick={handleCreateButtonClick}
        >
          <div className=" flex items-center space-x-2 justify-center h-full">
            <p className="text-sm font-medium text-foreground">
              {t("project.CreateDocument")}
            </p>
            <PlusIcon />
          </div>
        </Button>
      </div>
    </div>
  );

  return (
    <BaseModal
      open={state.open}
      onOpenChange={handleModalOpenChange}
      trigger={trigger}
      title={t("projects.createProject")}
      size="lg"
      variant="fixed"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <StepIndicator
            currentStep={state.currentStep}
            totalSteps={totalSteps}
          />
          <StepRenderer />
        </div>
        <ModalNavigation />
      </div>
    </BaseModal>
  );
}

function DocumentCreateModal() {
  return (
    <DocumentCreateModalProvider>
      <DocumentCreateModalContent />
    </DocumentCreateModalProvider>
  );
}

export default DocumentCreateModal;
