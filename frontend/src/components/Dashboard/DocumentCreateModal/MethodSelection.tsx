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
    availableMethods,
    onDoubleClick,
  }: {
    readonly selectedMethod: UploadMethod | null;
    readonly onMethodSelect: (method: UploadMethod) => void;
    readonly availableMethods: AvailableMethodType[];
    readonly onDoubleClick: () => void;
  }) => {
    const { t } = useTranslation();
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
      <div className="space-y-2">
        <div className="text-left">
          <p className="font-medium text-neutral-900 dark:text-neutral-200">
            {t(`projects.chooseInputMethod`)}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-500">
            {t(`projects.selectHowYouWantToCreateYourProject`)}
          </p>
        </div>

        <div className="grid gap-2">
          {availableMethods.map((method) => {
            const config = methodConfigs[method.type];
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
                className={cn("w-full text-left h-full p-2",
                  selectedMethod === method.type
                    ? "bg-neutral-50 dark:bg-neutral-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center space-x-2 w-full">
                  <div
                    className={cn(
                      "p-2 rounded-sm",
                      selectedMethod === method.type
                        ? "dark:bg-green-700 bg-green-100  dark:text-white text-green-700"
                        : "bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-400"
                    )}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className=" text-neutral-900 dark:text-neutral-200">
                      {config.title}{" "}
                      {config.isDisabled && (
                        <span className="text-gray-400 text-sm">
                          (Coming Soon)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
