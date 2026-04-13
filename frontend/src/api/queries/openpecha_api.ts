import { useQuery } from "@tanstack/react-query";
import {
  fetchLinkedResources,
  fetchTextContent,
  fetchTexts,
} from "../openpecha";

interface useFetchTextsParams {
  limit?: number;
  offset?: number;
  language?: string;
  title?: string;
}

export const useFetchTexts = ({
  limit,
  offset,
  language,
  title,
}: useFetchTextsParams) => {
  return useQuery({
    queryKey: ["texts", limit, offset, language, title],
    queryFn: () => fetchTexts({ limit, offset, language, title }),
    staleTime: 5 * 60 * 1000,
    enabled: title !== "" || title !== undefined,
  });
};

export const useFetchTextContent = (instanceId: string) => {
  return useQuery({
    queryKey: ["textContent", instanceId],
    queryFn: () => fetchTextContent(instanceId),
    enabled: !!instanceId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useFetchLinkedResources = (textId: string | undefined) => {
  return useQuery({
    queryKey: ["linkedResources", textId],
    queryFn: () => fetchLinkedResources(textId!),
    enabled: !!textId,
    staleTime: 5 * 60 * 1000,
  });
};
