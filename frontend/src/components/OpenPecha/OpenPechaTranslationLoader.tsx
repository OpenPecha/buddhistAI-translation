import React, { useState } from "react";
import { useMutation, QueryObserverResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createDocumentFromOpenPecha } from "@/api/document";
import { ErrorDisplay } from "@/components/shared/modals";
import { Button } from "@/components/ui/button";
import { useBdrcSearch, BdrcSearchResult } from "@/hooks/uesBDRC";
import { Search, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { fetchText } from "@/api/openpecha";
import { useFetchTexts } from "@/api/queries/openpecha_api";

type TextTitle = string | { bo?: string; en?: string;[key: string]: string | undefined };

interface SelectedText {
  id: string;
  title: TextTitle;
  language: string;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
}

function getDisplayTitle(title: TextTitle): string {
  if (typeof title === "string") return title;
  return title.bo || title.en || Object.values(title)[0] || "";
}

function SearchResultsPanel({
  heading,
  isLoading,
  loadingMessage,
  error,
  items,
  emptyMessage,
  hasQuery,
  onSelect,
}: {
  readonly heading: string;
  readonly isLoading: boolean;
  readonly loadingMessage: string;
  readonly error: string | null;
  readonly items: SearchResultItem[];
  readonly emptyMessage: string;
  readonly hasQuery: boolean;
  readonly onSelect: (item: SearchResultItem) => void;
}) {
  const panelHeader = (
    <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-700 border-b border-gray-200 dark:border-zinc-600">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
        {heading}
      </h3>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg overflow-hidden">
        {panelHeader}
        <div className="flex items-center animate-pulse text-sm p-4">
          <span>{loadingMessage}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-zinc-800 border border-red-300 dark:border-red-700 rounded-md shadow-lg overflow-hidden">
        {panelHeader}
        <p className="text-sm text-red-600 dark:text-red-400 p-4">{error}</p>
      </div>
    );
  }

  if (items.length > 0) {
    return (
      <div className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-700 border-b border-gray-200 dark:border-zinc-600 sticky top-0">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            {heading}
          </h3>
        </div>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 border-b border-gray-100 dark:border-zinc-700 last:border-b-0 transition-colors"
          >
            <div className="font-medium text-sm text-gray-900 dark:text-zinc-100">
              {item.title}
            </div>
            {item.subtitle && (
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                {item.subtitle}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (hasQuery) {
    return (
      <div className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md shadow-lg overflow-hidden">
        {panelHeader}
        <p className="text-sm text-gray-600 dark:text-zinc-400 p-4">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return null;
}

export function OpenPechaTranslationLoader({
  rootId,
  onSuccess,
  refetchTranslations,
}: {
  readonly rootId: string;
  readonly onSuccess: (id: string) => void;
  readonly refetchTranslations: () => Promise<
    QueryObserverResult<unknown, Error>
  >;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedBdrcResult, setSelectedBdrcResult] =
    useState<BdrcSearchResult | null>(null);
  const [isCheckingText, setIsCheckingText] = useState(false);
  const [textNotFound, setTextNotFound] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);

  const {
    results: bdrcResults,
    isLoading: isLoadingBdrc,
    error: bdrcError,
  } = useBdrcSearch(searchQuery, "Instance", 1000);

  const {
    data: titleSearchResults,
    isLoading: isLoadingTitleSearch,
    error: titleSearchError,
  } = useFetchTexts({ title: searchQuery, limit: 100 });

  const resolveTextById = React.useCallback(
    async (textId: string, bdrcResult?: BdrcSearchResult) => {
      if (bdrcResult) setSelectedBdrcResult(bdrcResult);
      setShowResults(false);
      setTextNotFound(false);
      setIsCheckingText(true);

      try {
        const text = await fetchText(textId);
        if (!text?.id) {
          setTextNotFound(true);
          return;
        }
        setSelectedText(text);
        setSelectedTextId(text.id);
      } catch (err) {
        console.error("Error fetching text from OpenPecha:", err);
        setTextNotFound(true);
      } finally {
        setIsCheckingText(false);
      }
    },
    []
  );

  const handleTitleResultSelect = React.useCallback(
    (item: SearchResultItem) => resolveTextById(item.id),
    [resolveTextById]
  );

  const handleBdrcResultSelect = React.useCallback(
    (result: BdrcSearchResult) => {
      if (!result.workId) {
        setSelectedBdrcResult(result);
        setTextNotFound(true);
        return;
      }
      resolveTextById(result.workId, result);
    },
    [resolveTextById]
  );

  const createTranslationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTextId) throw new Error("Please select a text");
      if (!rootId) throw new Error("Root document ID is required");
      return createDocumentFromOpenPecha(selectedTextId, rootId);
    },
    onSuccess: (response) => {
      const documentId = response.data?.id || response.id;
      onSuccess(documentId);
      refetchTranslations?.();
      navigate(`/documents/${rootId}?translation=${documentId}`);
    },
    onError: (error: Error) => {
      console.error("Error creating OpenPecha translation:", error);
      setError(error.message || "Failed to create OpenPecha translation");
    },
  });

  const handleCreateTranslation = () => {
    if (!selectedTextId) {
      setError("Please select a text");
      return;
    }
    setError("");
    createTranslationMutation.mutate();
  };

  const CATALOGER_URL =
    import.meta.env.VITE_CATALOGER_FRONTEND_URL || "http://localhost:8000";
  const catalogerUrl = React.useMemo(() => {
    const workIdParam = selectedBdrcResult?.workId
      ? `create?w_id=${selectedBdrcResult.workId}&i_id=${selectedBdrcResult.instanceId}`
      : "";
    return `${CATALOGER_URL}/${workIdParam}`;
  }, [CATALOGER_URL, selectedBdrcResult?.workId, selectedBdrcResult?.instanceId]);

  const titleItems: SearchResultItem[] = React.useMemo(() => {
    if (!Array.isArray(titleSearchResults)) return [];
    return titleSearchResults.map(
      (r: { id: string; title: { [key: string]: string | undefined } }) => ({
        id: `title-${r.id}`,
        title: r.title?.bo || Object.values(r.title || {})[0] || "",
        subtitle: `Text ID: ${r.id}`,
      })
    );
  }, [titleSearchResults]);

  const bdrcItems: SearchResultItem[] = React.useMemo(
    () =>
      bdrcResults.map((r) => ({
        id: r.workId || r.instanceId || `bdrc-${r.title}`,
        title: r.title || r.workId || "Untitled",
        subtitle: [
          r.workId && `BDRC ID: ${r.workId}`,
          r.language && `Language: ${r.language}`,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [bdrcResults]
  );

  const hasQuery = !!searchQuery.trim();

  return (
    <div className="space-y-8">
      <ErrorDisplay error={error} />

      <div className="space-y-4">
        <label
          htmlFor="bdrc-search"
          className="block text-sm font-medium text-gray-700 dark:text-zinc-300"
        >
          Search BDRC by Title or ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
          </div>
          <input
            id="bdrc-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            placeholder="Search BDRC texts..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md text-sm bg-white dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {showResults && searchQuery && (
          <div className="relative space-y-2">
            <SearchResultsPanel
              heading="OpenPecha"
              isLoading={isLoadingTitleSearch}
              loadingMessage="Searching OpenPecha..."
              error={
                titleSearchError
                  ? `Error searching OpenPecha: ${titleSearchError.message || String(titleSearchError)}`
                  : null
              }
              items={titleItems}
              emptyMessage="No OpenPecha texts found"
              hasQuery={hasQuery}
              onSelect={(item) =>
                handleTitleResultSelect({
                  ...item,
                  id: item.id.replace(/^title-/, ""),
                })
              }
            />
            <SearchResultsPanel
              heading="BDRC Results"
              isLoading={isLoadingBdrc}
              loadingMessage="Searching BDRC..."
              error={bdrcError ? `Error searching BDRC: ${bdrcError}` : null}
              items={bdrcItems}
              emptyMessage="No BDRC texts found"
              hasQuery={hasQuery}
              onSelect={(item) => {
                const match = bdrcResults.find(
                  (r) =>
                    (r.workId || r.instanceId || `bdrc-${r.title}`) === item.id
                );
                if (match) handleBdrcResultSelect(match);
              }}
            />
          </div>
        )}

        {isCheckingText && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
              <span>Checking if text exists...</span>
            </div>
          </div>
        )}

        {textNotFound && selectedBdrcResult && !isCheckingText && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  Text not found in catalog
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                  The text "
                  {selectedBdrcResult.title || selectedBdrcResult.workId}" (ID:{" "}
                  {selectedBdrcResult.workId}) is not present in the catalog.
                </p>
                <a
                  href={catalogerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                >
                  Create text on cataloger
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTextId && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Text selected successfully
            </p>
            {selectedText && (
              <div className="text-sm text-green-700 dark:text-green-400">
                <p>
                  <span className="font-medium">Text ID:</span>{" "}
                  {selectedText.id}
                </p>
                {selectedText.title && (
                  <p>
                    <span className="font-medium">Title:</span>{" "}
                    {getDisplayTitle(selectedText.title)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTextId && (
        <div className="flex justify-center">
          <Button
            onClick={handleCreateTranslation}
            disabled={createTranslationMutation.isPending}
            className=" w-full bg-secondary-600 hover:bg-secondary-700 text-white transition-colors"
          >
            {createTranslationMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Translation...
              </div>
            ) : (
              "Create Translation from OpenPecha"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
