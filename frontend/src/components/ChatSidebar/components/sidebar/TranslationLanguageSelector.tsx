import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";

import {
  TARGET_LANGUAGES,
  TargetLanguage,
} from "@/api/translate";
import { useTranslation } from "react-i18next";
import type { TranslationConfig } from "@/hooks/useTranslationSettings";

interface TargetLanguageProps {
  config: TranslationConfig;
  onConfigChange: <K extends keyof TranslationConfig>(
    key: K,
    value: TranslationConfig[K]
  ) => void;
  showLabel?: boolean;
}

const TargetLanguageSelector: React.FC<TargetLanguageProps> = ({
  config,
  onConfigChange,
  showLabel = true,
}: TargetLanguageProps) => {
  const { t } = useTranslation();
  return (
    <div>
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
export default TargetLanguageSelector;
