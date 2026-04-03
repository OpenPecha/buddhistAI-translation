import { useTranslation as useTranslationI18next } from "react-i18next";
import { diffWords } from "diff";
import { Save, X, BrainCircuit, Copy, Check, ChevronDown, ChevronUp, Replace } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditor } from "@/hooks/useEditor";
import { useTranslation } from "../../contexts/TranslationContext";
import DiffText from "./DiffText";
import type { FuzzyMatch } from "@/api/agent";

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: string;
  metadata?: {
    batch_id?: string;
    model_used?: string;
    text_type?: string;
  };
  previousTranslatedText?: string;
  isUpdated?: boolean;
  lineNumbers?: Record<string, { from: number; to: number }> | null;
  fromMemory?: boolean;
  fuzzyMatches?: FuzzyMatch[];
}

interface TranslationItemProps {
  result: TranslationResult;
  index: number;
  isStandardized: boolean;
}

const TranslationItem: React.FC<TranslationItemProps> = ({
  result,
  index,
  isStandardized,
}) => {
  const {
    copiedItems,
    expandedItems,
    editedTexts,
    editingId,
    editedText,
    copyResult: onCopyResult,
    toggleItemExpansion: onToggleItemExpansion,
    insertSingleResult: onInsertResult,
    startEditing: onStartEditing,
    cancelEditing: onCancelEditing,
    saveEdit: onSaveEdit,
    setEditedText: onEditTextChange,
    resetToOriginal: onResetToOriginal,
  } = useTranslation();

  const { scrollToLineNumber } = useEditor();
  const { t } = useTranslationI18next();
  const [fuzzyExpanded, setFuzzyExpanded] = useState(false);
  const [copiedFuzzyId, setCopiedFuzzyId] = useState<string | null>(null);

  const copyFuzzyMatch = async (text: string, matchId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedFuzzyId(matchId);
    setTimeout(() => setCopiedFuzzyId(null), 2000);
  };

  const getCurrentText = (result: TranslationResult): string => {
    if (editingId === result.id) return editedText;
    return editedTexts[result.id] || result.translatedText;
  };

  const formatLineNumbers = (result: TranslationResult): string => {
    if (!result.lineNumbers) return "";
    const lineRanges = Object.entries(result.lineNumbers);
    if (lineRanges.length === 0) return "";
    const [lineKey, range] = lineRanges[0];
    const lineNumber = Number.parseInt(lineKey, 10);
    return `${t("translation.line")} ${lineNumber}(${range.from}-${range.to})`;
  };

  const countChanges = (oldText: string, newText: string) => {
    const differences = diffWords(oldText, newText);
    let additions = 0;
    let deletions = 0;
    for (const part of differences) {
      if (part.added) additions++;
      else if (part.removed) deletions++;
    }
    return { additions, deletions };
  };

  const canInsert = !!(result.lineNumbers && Object.keys(result.lineNumbers).length > 0);
  const isCopied = copiedItems.has(result.id);
  const isEdited = !!editedTexts[result.id];
  const disabled = editingId !== null && editingId !== result.id;

  const renderTranslationContent = () => {
    if (editingId === result.id) {
      return (
        <div className="space-y-2 mt-1">
          <textarea
            value={editedText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm resize-vertical min-h-[120px] bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("translation.editTranslation")}
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={onSaveEdit} variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-3">
              <Save className="w-3 h-3 mr-1" />
              {t("common.save")}
            </Button>
            <Button onClick={onCancelEditing} variant="outline" size="sm" className="h-7 px-3">
              <X className="w-3 h-3 mr-1" />
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      );
    }

    const isClickable = editingId === null || editingId === result.id;
    const buttonClass = `rounded-md p-1.5 transition-colors w-full text-left text-sm ${isClickable
      ? "cursor-pointer hover:bg-white dark:hover:bg-zinc-700"
      : "cursor-not-allowed opacity-50"
      }`;

    if (editedTexts[result.id]) {
      return (
        <button
          type="button"
          onClick={() => isClickable && onStartEditing(result)}
          className={buttonClass}
          title={isClickable ? t("translation.clickToEditTranslation") : t("translation.anotherTranslationIsBeingEdited")}
        >
          <DiffText oldText={result.translatedText} newText={editedTexts[result.id]} />
        </button>
      );
    }

    if (result.isUpdated && result.previousTranslatedText) {
      return (
        <button
          type="button"
          onClick={() => isClickable && onStartEditing(result)}
          className={buttonClass}
          title={isClickable ? t("translation.clickToEditTranslation") : t("translation.anotherTranslationIsBeingEdited")}
        >
          <DiffText oldText={result.previousTranslatedText} newText={getCurrentText(result)} />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => isClickable && onStartEditing(result)}
        className={buttonClass}
        title={isClickable ? t("translation.clickToEditTranslation") : t("translation.anotherTranslationIsBeingEdited")}
      >
        {getCurrentText(result)}
      </button>
    );
  };

  return (
    <div className="rounded-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden">
      {/* Top row: line number + badges + actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
        <div className="flex items-center gap-2 flex-wrap">
          {formatLineNumbers(result) && (
            <button
              type="button"
              onClick={() => {
                if (!result.lineNumbers) return;
                const lineRanges = Object.entries(result.lineNumbers);
                if (lineRanges.length > 0) {
                  const [lineKey] = lineRanges[0];
                  scrollToLineNumber(Number.parseInt(lineKey, 10));
                }
              }}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-0.5 rounded-full transition-colors"
              title="Click to scroll to this line"
            >
              {formatLineNumbers(result)}
            </button>
          )}
          {isEdited && (() => {
            const changes = countChanges(result.translatedText, editedTexts[result.id]);
            return (
              <div className="flex items-center gap-1">
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  {t("translation.edited")}
                </span>
                {changes.additions > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">+{changes.additions}</span>
                )}
                {changes.deletions > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">-{changes.deletions}</span>
                )}
              </div>
            );
          })()}
          {result.isUpdated && result.previousTranslatedText && !isEdited && (() => {
            const changes = countChanges(result.previousTranslatedText, result.translatedText);
            return (
              <div className="flex items-center gap-1">
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {t("translation.updated")}
                </span>
                {changes.additions > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">+{changes.additions}</span>
                )}
                {changes.deletions > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">-{changes.deletions}</span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Action buttons */}
        <TooltipProvider>
          <div className="flex items-center gap-0.5">
            <Tooltip delayDuration={5}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onCopyResult(getCurrentText(result), result.id)}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className={`h-7 w-7 p-0 transition-colors ${isCopied
                    ? "text-green-600 bg-green-50 dark:bg-green-900/30"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isCopied ? "Copied!" : t("translation.copyToClipboard")}</TooltipContent>
            </Tooltip>

            {canInsert && (
              <Tooltip delayDuration={5}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onInsertResult({ ...result, translatedText: getCurrentText(result) })}
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Replace className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("translation.insertTranslationAtLine")}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Source */}
        <div className="flex gap-2.5">
          <div className="w-0.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">
              {t("translation.source")}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{result.originalText}</p>
          </div>
        </div>

        {/* Translation */}
        <div className="flex gap-2.5">
          <div className="w-0.5 rounded-full bg-blue-400 dark:bg-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 dark:text-blue-500 mb-0.5">
              {isStandardized ? t("translation.standardizedTranslation") : t("translation.translation")}
            </p>
            <div className="text-sm font-monlam-2 text-gray-900 dark:text-gray-100">
              {renderTranslationContent()}
            </div>
          </div>
        </div>

        {/* Fuzzy matches */}
        {result.fuzzyMatches && result.fuzzyMatches.length > 0 && (
          <div className="border-t border-gray-100 dark:border-zinc-700 pt-2">
            <button
              type="button"
              onClick={() => setFuzzyExpanded(!fuzzyExpanded)}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              {fuzzyExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <BrainCircuit className="w-3 h-3" />
              Translation Memory ({result.fuzzyMatches.length})
            </button>

            {fuzzyExpanded && (
              <div className="mt-2 space-y-2">
                {result.fuzzyMatches.map((match, idx) => {
                  const matchId = `${result.id}-fuzzy-${idx}`;
                  const isCopied = copiedFuzzyId === matchId;
                  return (
                    <div
                      key={matchId}
                      className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {Math.round(match.score * 100)}% {t("translation.match", "match")}
                          </span>
                          {match.model_name && (
                            <span className="text-amber-600 truncate dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                              {match.model_name}
                            </span>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip delayDuration={5}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => copyFuzzyMatch(match.target_text, matchId)}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded transition-colors ${isCopied
                                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                                  : "hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-600 dark:text-amber-400"
                                  }`}
                              >
                                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{isCopied ? "Copied" : t("translation.copyToClipboard")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 truncate">{match.source_text}</p>
                      <p className="text-gray-900 dark:text-gray-100 font-monlam-2 mt-1.5">{match.target_text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationItem;
