export interface Model {
  value: string;
  name: string;
  provider: string;
  capabilities: string[];
  contextWindow: number | null;
}

interface ModelData {
  provider: string;
  description: string;
  capabilities: string[];
  context_window: number | null;
}

export interface ModelsResponse {
  models: Record<string, ModelData>;
}

const getModels = async (): Promise<Model[]> => {
  const response = await fetch("/agent/ai/models");

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const result: ModelsResponse = await response.json();

  return Object.entries(result.models).map(([key, modelData]) => ({
    value: key,
    name: modelData.description,
    provider: modelData.provider,
    capabilities: modelData.capabilities,
    contextWindow: modelData.context_window,
  }));
};

export default getModels;
