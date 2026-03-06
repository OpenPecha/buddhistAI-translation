import { useQuery, useQueryClient } from "@tanstack/react-query";
import getModels, { type Model } from "@/api/model";
import type { ModelName } from "@/api/translate";

export const modelsKeys = {
  all: ["models"] as const,
  lists: () => [...modelsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...modelsKeys.lists(), filters] as const,
};

export const modelsQueryOptions = {
  queryKey: modelsKeys.lists(),
  queryFn: getModels,
};

export interface UseModelsReturn {
  models: Model[];
  modelNames: ModelName[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  invalidateModels: () => Promise<void>;
}

export const useModels = (): UseModelsReturn => {
  const queryClient = useQueryClient();

  const {
    data: models = [],
    isLoading,
    error,
    refetch,
  } = useQuery(modelsQueryOptions);

  const modelNames: ModelName[] = models.map(
    (model) => model.value as ModelName
  );

  const invalidateModels = async () => {
    await queryClient.invalidateQueries({ queryKey: modelsKeys.all });
  };

  return {
    models,
    modelNames,
    isLoading,
    error: error?.message || null,
    refetch,
    invalidateModels,
  };
};
