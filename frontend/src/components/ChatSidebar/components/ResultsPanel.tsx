import { AlertTriangle, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import TranslationResults from "./sidebar/TranslationResults";
import { useTranslation } from "../contexts/TranslationContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation as useTranslationI18next } from "react-i18next";

interface ResultsPanelProps {
  className?: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ className = "" }) => {
  const { t } = useTranslationI18next();

  const {
    translationResults,
    isTranslating,
    overwriteAllResults,
  } = useTranslation();

  const hasTranslationResults = translationResults.length > 0;

  if (!hasTranslationResults && !isTranslating) {
    return null;
  }

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("translation.translationResultsCount", {
            count: translationResults.length,
          })}
        </span>

        {hasTranslationResults && !isTranslating && (
          <Tooltip delayDuration={5}>
            <TooltipTrigger asChild>
              <Button
                onClick={overwriteAllResults}
                variant="ghost"
                size="sm"
                className="h-7 px-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Replace className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("translation.overwriteAllResults")}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3">
          {isTranslating && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                {t("translation.translatingStatus")}
              </div>
            </div>
          )}

          {!isTranslating && translationResults.length === 0 && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                    Translation Failed
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Try selecting a different AI model from settings
                  </p>
                </div>
              </div>
            </div>
          )}

          <TranslationResults />
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
