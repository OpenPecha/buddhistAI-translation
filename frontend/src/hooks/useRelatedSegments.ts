import { getRelatedSegments } from "@/api/resources";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const useRelatedSegments = (
  documentId: string,
  span_start: number,
  span_end: number
) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request when selection changes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new AbortController for the new request
    abortControllerRef.current = new AbortController();

    return () => {
      // Cleanup: abort request on unmount or when dependencies change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [documentId, span_start, span_end]);

  return useQuery({
    queryKey: ["relatedSegments", documentId, span_start, span_end],
    queryFn: ({ signal: querySignal }) => {
      // Use the AbortController signal, or fall back to React Query's signal
      const signal = abortControllerRef.current?.signal || querySignal;
      return getRelatedSegments(documentId, span_start, span_end, signal);
    },
    enabled: !!documentId && !!span_start && span_end > span_start,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

export default useRelatedSegments;
