import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import useRelatedSegments from "@/hooks/useRelatedSegments";
import { useEditor } from "@/hooks/useEditor";
import { useSelectionStore } from "@/stores/selectionStore";
import { RelatedSegmentResult } from "@/api/resources";

function Resources() {
  const { t } = useTranslation();

  const { activeEditor } = useEditor();
  const selection = useSelectionStore((state) =>
    activeEditor ? state.selections[activeEditor] : null
  );
  const { id } = useParams();

  // Get active selection range (start and end positions)
  const selectionRange = useMemo(() => {
    if (!selection?.range || selection.range.length === 0) {
      return null;
    }
    return {
      start: selection.range.index,
      end: selection.range.index + selection.range.length,
    };
  }, [selection]);

  // Debounce selection range
  const [debouncedSelectionRange, setDebouncedSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSelectionRange(selectionRange);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectionRange]);

  // Fetch related segments
  const {
    data: relatedSegments,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useRelatedSegments(
    id!,
    debouncedSelectionRange?.start ?? 0,
    debouncedSelectionRange?.end ?? 0
  );

  const loading = isLoading || isFetching;
  const hasResults = relatedSegments && relatedSegments.length > 0;
  const hasSelection = !!debouncedSelectionRange;
  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error State */}
        {error && (
          <div
            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 
                        border border-red-200 dark:border-red-800 rounded-lg mb-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 dark:text-red-300 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to load related segments"}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              {t("resources.retry", "Retry")}
            </button>
          </div>
        )}

        {/* Loading State - Skeleton */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={`skeleton-result-${index}`} className="mb-6">
                {/* Text Title Header Skeleton */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  </div>
                </div>

                {/* Segments Skeleton */}
                <div className="space-y-3">
                  {Array.from({ length: 2 }, (_, segIndex) => (
                    <div
                      key={`skeleton-segment-${index}-${segIndex}`}
                      className="p-3 bg-gray-50 dark:bg-card rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="mb-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="space-y-4">
            {relatedSegments.map(
              (result: RelatedSegmentResult, index: number) => {
                const resultKey = result.instance_source
                  ? `${result.instance_source}-${index}`
                  : `result-${index}`;
                return (
                  <div key={resultKey} className="mb-6">
                    {/* Text Title Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        {result.text_title && result.text_title.length > 0 && (
                          <p className="font-medium text-gray-900 dark:text-white font-monlam-2">
                            {result.text_title[0].text}
                          </p>
                        )}
                        {result.instance_source && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("resources.source", "Source")}:{" "}
                            {result.instance_source}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Segments */}
                    {result.segments && result.segments.length > 0 && (
                      <div className="space-y-3">
                        {result.segments.map((segment) => (
                          <div
                            key={segment.segment_id}
                            className="p-3 bg-gray-50 dark:bg-card rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <CollapsableDiv>
                              <span className="text-sm font-monlam-2 text-gray-800 dark:text-gray-200 leading-relaxed">
                                {segment.content}
                              </span>
                            </CollapsableDiv>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* Empty State - No Selection */}
        {!hasSelection && !loading && (
          <div className="flex flex-col items-center justify-center  text-center">
            <div className="bg-gray-100 dark:bg-zinc-800 rounded-full p-2">
              <BookOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-lg text-gray-900 dark:text-white mb-2">
              {t("resources.emptyTitle", "Related Segments")}
            </p>
            <p className="text-gray-600 dark:text-zinc-400 text-sm">
              {t(
                "resources.emptyDescription",
                "Select text in the editor to see related segments from other texts"
              )}
            </p>
          </div>
        )}

        {/* Empty State - No Results */}
        {hasSelection && !loading && !hasResults && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t("resources.noResults", "No Related Segments Found")}
            </h4>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              {t(
                "resources.noResultsDescription",
                "No related segments found for the selected text"
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const CollapsableDiv = ({ children }: { children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  // Extract text content from children for length check
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === "string") {
      return node;
    }
    if (typeof node === "number") {
      return String(node);
    }
    if (React.isValidElement(node)) {
      const props = node.props as Record<string, unknown>;
      const propsChildren = props?.children as React.ReactNode | undefined;
      if (propsChildren) {
        return getTextContent(propsChildren);
      }
    }
    return "";
  };

  const textContent = getTextContent(children);
  const shouldCollapse = textContent.length > 150;

  return (
    <div className="flex flex-col gap-2 font-monlam-2">
      <div
        className={`text-sm text-gray-700 dark:text-gray-300 ${!isExpanded && shouldCollapse ? "line-clamp-3" : ""
          }`}
      >
        {children}
      </div>
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline self-start"
        >
          {isExpanded
            ? t("common.showLess", "Show less")
            : t("common.showMore", "Show more")}
        </button>
      )}
    </div>
  );
};

export default Resources;
