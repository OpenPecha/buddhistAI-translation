import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Settings, Languages, FileText, X } from "lucide-react";

import {
  TARGET_LANGUAGES,
  TEXT_TYPES,
  TargetLanguage,
  TextType,
  ModelName,
} from "@/api/translate";
import { useTranslation } from "react-i18next";
import { TranslationContextFileSelector } from "./TranslationContextFileSelector";
import type { TranslationConfig } from "@/hooks/useTranslationSettings";

interface TargetLanguageProps {
  config: TranslationConfig;
  onConfigChange: <K extends keyof TranslationConfig>(
    key: K,
    value: TranslationConfig[K]
  ) => void;
  showLabel?: boolean;
}
type SettingsModalProps = TargetLanguageProps & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onOpenChange,
  onConfigChange,
}) => {
  const { t } = useTranslation();

  const handleOverlayClick = () => {
    onOpenChange(false);
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 rounded-md"
        title={t("translation.translationSettings")}
        onClick={() => onOpenChange(true)}
      >
        <Settings className="w-3 h-3" />
      </Button>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <div
            className="bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-secondary-600" />
                </div>
                <h2 id="settings-modal-title" className="text-lg font-semibold">
                  {t("translation.translationSettings")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Core Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Text Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {t("translation.contentType")}
                      </Label>
                      <Select
                        value={config.textType}
                        onValueChange={(value: TextType) =>
                          onConfigChange("textType", value)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEXT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <TranslationContextFileSelector
                  config={config}
                  onConfigChange={onConfigChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const TargetLanguageSelector: React.FC<TargetLanguageProps> = ({
  config,
  onConfigChange,
  showLabel = true,
}: TargetLanguageProps) => {
  const { t } = useTranslation();
  return (
    <div className="px-2 border-t pt-2">
      {showLabel && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Languages className="w-3 h-3" />
          {t("translation.targetLanguage")}
        </Label>
      )}
      <Select
        value={config.targetLanguage}
        onValueChange={(value: TargetLanguage) =>
          onConfigChange("targetLanguage", value)
        }
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TARGET_LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
export default SettingsModal;
