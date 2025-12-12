import { getRelatedSegments } from "@/api/resources";
import { useQuery } from "@tanstack/react-query";

const useRelatedSegments = (
  documentId: string,
  span_start: number,
  span_end: number
) => {
  return useQuery({
    queryKey: ["relatedSegments", documentId, span_start, span_end],
    queryFn: () => getRelatedSegments(documentId, span_start, span_end),
  });
};

export default useRelatedSegments;
