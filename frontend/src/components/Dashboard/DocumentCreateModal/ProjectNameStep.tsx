import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface ProjectNameStepProps {
  projectName: string;
  setProjectName: (name: string) => void;
  onNext: () => void;
}

export const ProjectNameStep = React.memo(
  ({ projectName, setProjectName, onNext }: ProjectNameStepProps) => {
    const { t } = useTranslation();

    return (
      <div className="space-y-5 pt-2 px-1">
        <div className="text-left space-y-1">
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {t(`projects.projectDetails`)}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t(`projects.enterProjectName`)}
          </p>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="projectName"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t(`projects.projectName`)}
          </Label>
          <Input
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && projectName.trim().length > 0) {
                onNext();
              }
            }}
            placeholder={t(`projects.enterProjectName`)}
            className="h-11"
            autoFocus
          />
        </div>
      </div>
    );
  }
);

ProjectNameStep.displayName = "ProjectNameStep";
