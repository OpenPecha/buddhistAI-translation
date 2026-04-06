import React from "react";
import { useTranslation } from "react-i18next";
import { File, FileText, Cable } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailableMethodType, UploadMethod } from "./types";
import { Button } from "@/components/ui/button";

export const MethodSelection = React.memo(
  ({
    selectedMethod,
    onMethodSelect,
    onDoubleClick,
  }: {
    readonly selectedMethod: UploadMethod | null;
    readonly onMethodSelect: (method: UploadMethod) => void;
    readonly onDoubleClick: () => void;
  }) => {
    const { t } = useTranslation();
    const availableMethods: AvailableMethodType[] = [
      { type: "empty", label: t("common.emptyText") },
      { type: "file", label: t("common.file") },
      { type: "openpecha", label: t("common.openpecha") }
    ];
    const methodConfigs = {
      empty: {
        icon: <FileText size={24} />,
        title: t("documents.emptyText"),
        description: t("documents.startEmptyDocument"),
        isDisabled: false,
      },
      file: {
        icon: <File size={24} />,
        title: t("common.file"),
        description: t("projects.uploadAFileFromYourComputer"),
        isDisabled: false,
      },
      openpecha: {
        icon: <Cable size={24} />,
        title: t("common.openpecha"),
        description: t("projects.importFromOpenPechaRepository"),
        isDisabled: false,
      },
    };

    return (
      <div className="space-y-4 pt-2 px-1">
        <div className="text-left space-y-1">
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-200">
            {t(`projects.chooseInputMethod`)}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t(`projects.selectHowYouWantToCreateYourProject`)}
          </p>
        </div>

        <div className="grid gap-3">
          {availableMethods.map((method) => {
            const config = methodConfigs[method.type];
            const isSelected = selectedMethod === method.type;
            return (
              <Button
                variant="outline"
                key={method.type}
                disabled={config.isDisabled}
                type="button"
                onClick={() => onMethodSelect(method.type)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onMethodSelect(method.type);
                  }
                }}
                onDoubleClick={onDoubleClick}
                className={cn(
                  "w-full text-left h-auto py-3.5 px-4 transition-all duration-200",
                  isSelected
                    ? "border-green-500 bg-green-50/50 ring-1 ring-green-500/20 dark:bg-green-950/30 dark:border-green-600 dark:ring-green-500/10"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50"
                )}
              >
                <div className="flex items-center gap-3.5 w-full">
                  <div
                    className={cn(
                      "p-2.5 rounded-lg shrink-0 transition-colors duration-200",
                      isSelected
                        ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-200">
                      {config.title}{" "}
                      {config.isDisabled && (
                        <span className="text-neutral-400 text-xs font-normal">
                          (Coming Soon)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    );
  }
);

MethodSelection.displayName = "MethodSelection";
