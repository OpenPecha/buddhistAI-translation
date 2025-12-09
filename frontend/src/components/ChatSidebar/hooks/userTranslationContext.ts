import { fetchTranslationContext } from "@/api/document";
import { useQuery } from "@tanstack/react-query";

const useTranslationContext = (documentId: string) => {
  return useQuery({
    queryKey: ["translationContext", documentId],
    queryFn: () => fetchTranslationContext(documentId),
    enabled: !!documentId,
  });
};

export default useTranslationContext;
