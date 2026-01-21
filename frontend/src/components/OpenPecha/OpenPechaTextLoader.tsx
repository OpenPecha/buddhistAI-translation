import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDocumentFromOpenPecha } from "@/api/document";
import { ErrorDisplay } from "@/components/shared/modals";
import { useBdrcSearch, BdrcSearchResult } from "@/hooks/uesBDRC";
import { Search, AlertCircle, ExternalLink } from "lucide-react";
import { fetchText } from "@/api/openpecha";
import { useFetchTexts } from "@/api/queries/openpecha_api";
import OpenPecha from "@/assets/icon.png";

export function OpenPechaTextLoader({
  projectName,
  closeModal,
  onValidationChange,
  onCreateProject,
}: {
  readonly projectName: string;
  readonly closeModal: () => void;
  readonly onValidationChange?: (isValid: boolean) => void;
  readonly onCreateProject?: React.MutableRefObject<(() => void) | null>;
}) {
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBdrcResults, setShowBdrcResults] = useState(false);
  const [showTitleResults, setShowTitleResults] = useState(false);
  const [selectedBdrcResult, setSelectedBdrcResult] =
    useState<BdrcSearchResult | null>(null);
  const [isCheckingBdrcText, setIsCheckingBdrcText] = useState(false);
  const [isCheckingTitleText, setIsCheckingTitleText] = useState(false);
  const [bdrcTextNotFound, setBdrcTextNotFound] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [selectedText, setSelectedText] = useState<{
    id: string;
    title:
    | string
    | { bo?: string; en?: string;[key: string]: string | undefined };
    language: string;
  } | null>(null);

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

  // Validation state
  const isValid = !!(selectedTextId && projectName.trim());

  // Notify parent about validation state
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!projectName) {
        throw new Error("Project name is required");
      }

      if (!selectedTextId) {
        throw new Error("No text selected");
      }

      // Use the backend endpoint to create document and project from OpenPecha textId
      return createDocumentFromOpenPecha(selectedTextId, null);
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      closeModal();
      const rootId = data.roots?.[0]?.id || data.id;
      window.location.href = `/documents/${rootId}`;
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to create project");
    },
  });

  const handleCreateProject = React.useCallback(() => {
    if (!projectName) {
      setError("Project name is required");
      return;
    }

    setError("");
    createProjectMutation.mutate();
  }, [projectName, createProjectMutation]);

  // Expose the create function to parent
  React.useEffect(() => {
    if (onCreateProject) {
      (onCreateProject as React.MutableRefObject<(() => void) | null>).current =
        handleCreateProject;
    }
  }, [handleCreateProject, onCreateProject]);

  // Handle title search result selection
  const handleTitleResultSelect = React.useCallback(
    async (result: {
      id: string;
      title: { [key: string]: string | undefined };
    }) => {
      setShowTitleResults(false);
      setShowBdrcResults(false);
      setBdrcTextNotFound(false);
      setIsCheckingTitleText(true);

      try {
        // Fetch text details to verify it exists
        const text = await fetchText(result.id);

        if (!text?.id) {
          setIsCheckingTitleText(false);
          setBdrcTextNotFound(true);
          return;
        }

        // Set the text - backend will handle fetching instances and content
        setSelectedText(text);
        setSelectedTextId(text.id);

        setIsCheckingTitleText(false);
      } catch (err) {
        console.error("Error fetching text from OpenPecha:", err);
        setIsCheckingTitleText(false);
        setBdrcTextNotFound(true);
      }
    },
    []
  );

  // Handle BDRC result selection
  const handleBdrcResultSelect = React.useCallback(
    async (result: BdrcSearchResult) => {
      setSelectedBdrcResult(result);
      setShowBdrcResults(false);
      setBdrcTextNotFound(false);
      setIsCheckingBdrcText(true);

      if (!result.workId) {
        setIsCheckingBdrcText(false);
        setBdrcTextNotFound(true);
        return;
      }

      try {
        // Fetch text from openpecha using workId to verify it exists
        const text = await fetchText(result.workId);

        if (!text?.id) {
          setIsCheckingBdrcText(false);
          setBdrcTextNotFound(true);
          return;
        }

        // Set the text - backend will handle fetching instances and content
        setSelectedText(text);
        setSelectedTextId(text.id);

        setIsCheckingBdrcText(false);
      } catch (err) {
        console.error("Error fetching text from OpenPecha:", err);
        setIsCheckingBdrcText(false);
        setBdrcTextNotFound(true);
      }
    },
    []
  );

  // Cataloger URL
  const CATALOGER_URL =
    import.meta.env.VITE_CATALOGER_FRONTEND_URL || "http://localhost:8000";
  const catalogerUrl = React.useMemo(() => {
    const workIdParam = selectedBdrcResult?.workId
      ? `create?w_id=${selectedBdrcResult.workId}&i_id=${selectedBdrcResult.instanceId}`
      : "";
    return `${CATALOGER_URL}/${workIdParam}`;
  }, [
    CATALOGER_URL,
    selectedBdrcResult?.workId,
    selectedBdrcResult?.instanceId,
  ]);

  // Render title search results
  const renderTitleSearchResults = () => {
    if (isLoadingTitleSearch) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="animate-spin h-4 w-4 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Searching OpenPecha...</span>
          </div>
        </div>
      );
    }

    if (titleSearchError) {
      return (
        <div className="w-full bg-white border border-red-300 rounded-md shadow-lg p-4">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 -mx-4 -mt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">OpenPecha</h3>
          </div>
          <p className="text-sm text-red-600">
            Error searching OpenPecha:{" "}
            {titleSearchError.message || String(titleSearchError)}
          </p>
        </div>
      );
    }

    if (
      titleSearchResults &&
      Array.isArray(titleSearchResults) &&
      titleSearchResults.length > 0
    ) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="px-4 py-2 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 border-b sticky top-0">
            <img src={OpenPecha} alt="OpenPecha" className="w-5 h-5" />
            <p className="text-sm font-semibold">OpenPecha</p>
          </div>
          {titleSearchResults.map(
            (result: {
              id: string;
              title: {
                bo?: string;
                en?: string;
                [key: string]: string | undefined;
              };
            }) => (
              <button
                key={`title-${result.id}`}
                onClick={() => handleTitleResultSelect(result)}
                className="w-full cursor-pointer px-4 py-3 text-left border-b border-gray-100 dark:border-neutral-700 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-sm">
                  {result.title?.bo || Object.values(result.title || {})[0]}
                </div>
                <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  Text ID: {result.id}fd
                </div>
              </button>
            )
          )}
        </div>
      );
    }

    if (searchQuery.trim() && !isLoadingTitleSearch) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg p-4">
          <p className="text-sm">No OpenPecha texts found</p>
        </div>
      );
    }

    return null;
  };

  // Render BDRC search results
  const renderBdrcSearchResults = () => {
    if (isLoadingBdrc) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="animate-spin h-4 w-4 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Searching BDRC...</span>
          </div>
        </div>
      );
    }

    if (bdrcError) {
      return (
        <div className="w-full bg-white border border-red-300 rounded-md shadow-lg p-4">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 -mx-4 -mt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">BDRC</h3>
          </div>

          <p className="text-sm text-red-600">
            Error searching BDRC:{" "}
            {(bdrcError as any)?.message || String(bdrcError)}
          </p>
        </div>
      );
    }

    if (bdrcResults && Array.isArray(bdrcResults) && bdrcResults.length > 0) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="px-4 py-2 flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 border-b sticky top-0">

            <img src="https://www.bdrc.io/wp-content/uploads/2020/02/android-chrome-512x512-1.png" alt="BDRC" className="w-5 h-5 dark:invert" />

            <p className="text-sm font-semibold">BDRC</p>
          </div>

          {bdrcResults.map((result) => (
            <button
              key={result.workId || result.instanceId || `bdrc-${result.title}`}
              onClick={() => handleBdrcResultSelect(result)}
              className="w-full cursor-pointer px-4 py-3 text-left border-b border-gray-100 dark:border-neutral-700 last:border-b-0 transition-colors"
            >
              <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                {result.title || result.workId || "Untitled"}
              </div>

              {(result.workId || result.instanceId) && (
                <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  Text ID: {result.workId || result.instanceId}
                </div>
              )}

              {result.language && (
                <div className="text-xs text-gray-500 dark:text-neutral-400">
                  Language: {result.language}
                </div>
              )}
            </button>
          ))}
        </div>
      );
    }

    if (searchQuery.trim() && !isLoadingBdrc) {
      return (
        <div className="w-full bg-white border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 rounded-md shadow-lg p-4">
          <p className="text-sm">No BDRC texts found</p>
        </div>
      );
    }

    return null;
  };


  return (
    <div className="space-y-8">
      <ErrorDisplay error={error} />

      {/* BDRC Search Section */}
      <div className="space-y-4">
        <label
          htmlFor="bdrc-search"
          className="block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          Search BDRC by Title or ID
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="bdrc-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowBdrcResults(true);
              setShowTitleResults(true);
            }}
            placeholder="Search texts..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-md text-sm bg-white dark:bg-neutral-800 focus:outline-none ring-0"
          />
        </div>

        {(showTitleResults || showBdrcResults) && searchQuery && (
          <div className="relative space-y-2">
            {showTitleResults && renderTitleSearchResults()}

            {showBdrcResults && renderBdrcSearchResults()}
          </div>
        )}

        {(isCheckingBdrcText || isCheckingTitleText) && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Checking if text exists...</span>
            </div>
          </div>
        )}

        {/* BDRC Text Not Found Message */}
        {bdrcTextNotFound && selectedBdrcResult && !isCheckingBdrcText && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Text not found in catalog
                </p>
                <p className="text-sm text-yellow-700 mb-3">
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

      {/* Selected Text Information */}
      {selectedTextId && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 dark:border-green-700 dark:bg-green-900/20 rounded-md">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Text selected successfully
            </p>
            {selectedText && (
              <div className="text-sm text-green-700 dark:text-green-500">
                <p>
                  <span className="font-medium">Text ID:</span> {selectedTextId}
                </p>
                {selectedText.title && (
                  <p>
                    <span className="font-medium">Title:</span>{" "}
                    {typeof selectedText.title === "string"
                      ? selectedText.title
                      : selectedText.title.bo ||
                      selectedText.title.en ||
                      Object.values(selectedText.title)[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
