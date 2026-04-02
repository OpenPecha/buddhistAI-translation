import { useTranslation as useTranslationI18next } from "react-i18next";
import { diffWords } from "diff";
import { Save, X, BrainCircuit, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
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
import ActionMenu from "./ActionMenu";
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
    if (editingId === result.id) {
      return editedText;
    }
    const result_text = editedTexts[result.id] || result.translatedText;
    return result_text;
  };

  const formatLineNumbers = (result: TranslationResult): string => {
    if (!result.lineNumbers) return "";

    const lineRanges = Object.entries(result.lineNumbers);
    if (lineRanges.length === 0) return "";

    const [lineKey, range] = lineRanges[0];
    const lineNumber = Number.parseInt(lineKey, 10);
    return `${t("translation.line")} ${lineNumber}(${range.from}-${range.to})`;
  };

  const countChanges = (
    oldText: string,
    newText: string
  ): { additions: number; deletions: number } => {
    const differences = diffWords(oldText, newText);
    let additions = 0;
    let deletions = 0;

    for (const part of differences) {
      if (part.added) {
        additions++;
      } else if (part.removed) {
        deletions++;
      }
    }

    return { additions, deletions };
  };

  const renderTranslationContent = () => {
    if (editingId === result.id) {
      return (
        <div className="space-y-2">
          <textarea
            value={editedText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm resize-vertical min-h-[180px]"
            placeholder={t("translation.editTranslation")}
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={onSaveEdit}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-3 h-3" />
              <span className="font-sans">{t("common.save")}</span>
            </Button>
            <Button
              onClick={onCancelEditing}
              variant="outline"
              size="sm"
            >
              <X className="w-3 h-3" />
              <span className="font-sans">{t("common.cancel")}</span>
            </Button>
          </div>
        </div>
      );
    }

    const isClickable = editingId === null || editingId === result.id;
    const commonButtonProps = {
      type: "button" as const,
      onClick: () => {
        if (isClickable) {
          onStartEditing(result);
        }
      },
      className: `rounded p-1 transition-colors w-full text-left ${isClickable
        ? "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
        : "cursor-not-allowed opacity-50"
        }`,
      title: isClickable
        ? t("translation.clickToEditTranslation")
        : t("translation.anotherTranslationIsBeingEdited"),
    };

    if (editedTexts[result.id]) {
      return (
        <button {...commonButtonProps}>
          <DiffText
            oldText={
              result.translatedText
            }
            newText={
              editedTexts[result.id]
            }
          />
        </button>
      );
    }

    if (result.isUpdated && result.previousTranslatedText) {
      return (
        <button {...commonButtonProps}>
          <DiffText
            oldText={
              result.previousTranslatedText
            }
            newText={
              getCurrentText(result)
            }
          />
        </button>
      );
    }

    return (
      <button {...commonButtonProps}>
        {getCurrentText(result)}
      </button>
    );
  };

  return (
    <div>
      <div className=" dark:bg-zinc-800 bg-neutral-50 border-b rounded-t-lg p-2">
        <ActionMenu
          result={result}
          currentText={getCurrentText(result)}
          isCopied={copiedItems.has(result.id)}
          isEdited={!!editedTexts[result.id]}
          isExpanded={expandedItems.has(index)}
          canInsert={
            !!(result.lineNumbers && Object.keys(result.lineNumbers).length > 0)
          }
          onCopy={() => onCopyResult(getCurrentText(result), result.id)}
          onInsert={() =>
            onInsertResult({
              ...result,
              translatedText: getCurrentText(result),
            })
          }
          onEdit={() => onStartEditing(result)}
          onReset={() => onResetToOriginal(result)}
          onToggleExpand={() => onToggleItemExpansion(index)}
          disabled={editingId !== null && editingId !== result.id}
        />
      </div>
      <div
        key={result.id}
        className="bg-neutral-100 dark:bg-neutral-800 rounded-b-lg p-3"
      >
        <div className="flex items-center gap-2">
          {formatLineNumbers(result) && (
            <button
              type="button"
              className="text-xs text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-600 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-secondary-600 transition-colors"
              onClick={() => {
                if (!result.lineNumbers) return;
                const lineRanges = Object.entries(result.lineNumbers);
                if (lineRanges.length > 0) {
                  const [lineKey] = lineRanges[0];
                  const lineNumber = Number.parseInt(lineKey, 10);
                  scrollToLineNumber(lineNumber);
                }
              }}
              title="Click to scroll to this line in the editor"
            >
              {formatLineNumbers(result)}
            </button>
          )}
        </div>
        <div className="space-y-2">
          <div className="border-l-4 border-gray-300 pl-3">
            <span className="text-neutral-900 text-xs font-medium dark:text-neutral-300">
              {t("translation.source")}
            </span>
            <div className="text-sm text-neutral-800 dark:text-neutral-100 truncate">
              {result.originalText}
            </div>
          </div>
          <div className="border-l-4 border-[#12A7FC] pl-3">
            <div className="text-xs text-neutral-700 dark:text-neutral-100 mb-1 font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-neutral-800 dark:text-neutral-300">
                  {isStandardized
                    ? t("translation.standardizedTranslation")
                    : t("translation.translation")}
                </span>
                {editedTexts[result.id] &&
                  (() => {
                    const changes = countChanges(
                      result.translatedText,
                      editedTexts[result.id]
                    );
                    return (
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          {t("translation.edited")}
                        </span>
                        {changes.additions > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                            +{changes.additions}
                          </span>
                        )}
                        {changes.deletions > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">
                            -{changes.deletions}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                {result.isUpdated &&
                  result.previousTranslatedText &&
                  (() => {
                    const changes = countChanges(
                      result.previousTranslatedText,
                      result.translatedText
                    );
                    return (
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">
                          {t("translation.updated")}
                        </span>
                        {changes.additions > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                            +{changes.additions}
                          </span>
                        )}
                        {changes.deletions > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-medium">
                            -{changes.deletions}
                          </span>
                        )}
                      </div>
                    );
                  })()}
              </div>
            </div>

            <div className="text-sm font-monlam-2 text-neutral-800 dark:text-neutral-100">
              {renderTranslationContent()}
            </div>
          </div>

          {result.fuzzyMatches && result.fuzzyMatches.length > 0 && (
            <div className="mt-2 border-l-4 border-amber-300 dark:border-amber-600 pl-3">
              <button
                type="button"
                onClick={() => setFuzzyExpanded(!fuzzyExpanded)}
                className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium hover:underline cursor-pointer"
              >
                {fuzzyExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <BrainCircuit className="w-3 h-3" />Translation Memory
                ({result.fuzzyMatches.length})
              </button>
              {fuzzyExpanded && (
                <div className="mt-1.5 space-y-2">
                  {result.fuzzyMatches.map((match, idx) => {
                    const matchId = `${result.id}-fuzzy-${idx}`;
                    const isCopied = copiedFuzzyId === matchId;
                    return (
                      <div
                        key={matchId}
                        className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {Math.round(match.score * 100)}% {t("translation.match", "match")}
                          </span>
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
                                  {isCopied ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isCopied ? "Copied" : t("translation.copyToClipboard")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400 truncate">
                          {match.source_text}
                        </div>
                        <div className="text-neutral-900 dark:text-neutral-100 font-monlam-2 mt-2">
                          {match.target_text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default TranslationItem;
