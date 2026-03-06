// Export all hooks for easy importing
export { useTranslationOperations } from "./useTranslationOperations";
export { useTranslationResults } from "./useTranslationResults";
export { useCopyOperations } from "./useCopyOperations";
export { useGlossaryOperations } from "./useGlossaryOperations";
export { useStandardizationOperations } from "./useStandardizationOperations";

// Export types for external use
export type {
  TranslationResult,
} from "./useTranslationOperations";
export type { TranslationConfig } from "@/hooks/useTranslationSettings";
export type { GlossaryTerm, GlossaryEvent } from "./useGlossaryOperations";
