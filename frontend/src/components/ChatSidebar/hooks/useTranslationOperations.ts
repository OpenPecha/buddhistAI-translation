import { useState, useRef } from "react";
import { performAITranslation } from "@/api/agent";
import { useTranslation } from "react-i18next";
import type { TranslationConfig } from "@/hooks/useTranslationSettings";

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
}

interface UseTranslationOperationsProps {
  config: TranslationConfig;
  selectedTextLineNumbers: Record<string, { from: number; to: number }> | null;
  selectedAgentId?: string;
  onStreamComplete?: (results: TranslationResult[]) => void;
}

export const useTranslationOperations = ({
  config,
  selectedTextLineNumbers,
  selectedAgentId,
  onStreamComplete,
}: UseTranslationOperationsProps) => {
  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResults, setTranslationResults] = useState<
    TranslationResult[]
  >([]);

  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentSegmentIndexRef = useRef<number>(0);
  const { t } = useTranslation();
  // Helper function to create segment-specific line number mappings
  const createSegmentLineMapping = (
    selectedText: string,
    capturedLineNumbers: Record<string, { from: number; to: number }> | null
  ): Array<Record<string, { from: number; to: number }> | null> => {
    if (!capturedLineNumbers) return [];

    const textLines = selectedText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const lineNumberEntries = Object.entries(capturedLineNumbers);
    const segmentMappings: Array<Record<
      string,
      { from: number; to: number }
    > | null> = [];

    // Map each text segment to its corresponding line number
    for (let i = 0; i < textLines.length; i++) {
      if (i < lineNumberEntries.length) {
        // Create a mapping for this specific segment with its corresponding line
        const [lineKey, range] = lineNumberEntries[i];
        segmentMappings.push({
          [lineKey]: range,
        });
      } else {
        // If we have more segments than line mappings, use null
        segmentMappings.push(null);
      }
    }

    return segmentMappings;
  };

  const startTranslation = async (text: string) => {
    const selectedText = text;
    if (!selectedText.trim()) {
      setError("Please enter text to translate");
      return;
    }

    if (!selectedAgentId) {
      setError("Please select an AI agent first");
      return;
    }

    resetTranslations();
    // Reset segment index counter
    currentSegmentIndexRef.current = 0;

    // Capture current line numbers before translation starts
    const capturedLineNumbers = selectedTextLineNumbers;
    setIsTranslating(true);
    setCurrentStatus(t("translation.initializing"));
    setProgressPercent(0);
    setError(null);

    // Create abort controller for this translation
    abortControllerRef.current = new AbortController();

    try {
      // Split selected text by newlines and filter out empty lines
      const textLines = selectedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Create segment-specific line number mappings
      const segmentLineMappings = createSegmentLineMapping(
        selectedText,
        capturedLineNumbers
      );

      // Validate that we have text to translate
      if (textLines.length === 0) {
        setError("No valid text lines found to translate");
        setIsTranslating(false);
        return;
      }

      setCurrentStatus("Processing with AI agent...");
      setProgressPercent(10);

      const response = await performAITranslation({
        assistant_id: selectedAgentId,
        target_language: config.targetLanguage,
        prompt: textLines,
        model: config.modelName ?? "claude-3-5-haiku-20241022",
      });

      if (response.errors && response.errors.length > 0) {
        throw new Error(response.errors.join(", "));
      }

      setProgressPercent(90);
      setCurrentStatus("Processing results...");

      // Extract output_text from results
      const results = response.results.map((result, index) => {
        const segmentLineNumbers = segmentLineMappings?.[index] || null;
        
        return {
          id: `ai-${Date.now()}-${index}`,
          originalText: textLines[index] || "",
          translatedText: result.output_text,
          timestamp: response.metadata.completed_at,
          metadata: {
            batch_id: "ai-batch",
            model_used: config.modelName,
            processing_time: response.metadata.total_processing_time,
          },
          lineNumbers: segmentLineNumbers,
        } as TranslationResult;
      });

      setTranslationResults(results);
      setProgressPercent(100);
      setCurrentStatus("Translation complete");
      setIsTranslating(false);

      if (onStreamComplete) {
        onStreamComplete(results);
      }
    } catch (err) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("AI translation error:", err);
      const errorMessage = err instanceof Error ? err.message : "AI translation failed";
      setError(errorMessage);
      setIsTranslating(false);
      setCurrentStatus("Error");
    }
  };

  const stopTranslation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTranslating(false);
    setCurrentStatus("Stopped");
  };

  const resetTranslations = () => {
    setTranslationResults([]);
    setError(null);
    setCurrentStatus("");
    setProgressPercent(0);
  };

  const updateTranslationResults = (
    updater: (prev: TranslationResult[]) => TranslationResult[]
  ) => {
    setTranslationResults(updater);
  };

  return {
    // State
    isTranslating,
    translationResults,
    currentStatus,
    error,
    progressPercent,

    // Actions
    startTranslation,
    stopTranslation,
    resetTranslations,
    updateTranslationResults,
    setError,
  };
};
