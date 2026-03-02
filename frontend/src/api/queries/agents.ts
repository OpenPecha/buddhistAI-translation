import { useQuery } from "@tanstack/react-query";
import getAgents, { type Agent, type AgentDetail, getAgentDetail } from "@/api/agent";

export const agentsKeys = {
  all: ["agents"] as const,
  lists: () => [...agentsKeys.all, "list"] as const,
  list: (skip?: number, limit?: number) =>
    [...agentsKeys.lists(), { skip, limit }] as const,
  detail: (id: string) => [...agentsKeys.all, "detail", id] as const,
};

export const agentsQueryOptions = (skip: number = 0, limit: number = 10) => ({
  queryKey: agentsKeys.list(skip, limit),
  queryFn: () => getAgents(skip, limit)
});

export const agentDetailQueryOptions = (id: string) => ({
  queryKey: agentsKeys.detail(id),
  queryFn: () => getAgentDetail(id)
});

export interface UseAgentsReturn {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  total: number;
}

export const useAgents = (skip: number = 0, limit: number = 10): UseAgentsReturn => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery(agentsQueryOptions(skip, limit));

  return {
    agents: data?.assistants || [],
    isLoading,
    error: error?.message || null,
    refetch,
    total: data?.total || 0,
  };
};

export interface UseAgentDetailReturn {
  agent: AgentDetail | null;
  isLoading: boolean;
  error: string | null;
}

export const useAgentDetail = (id: string | undefined): UseAgentDetailReturn => {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    ...agentDetailQueryOptions(id!),
    enabled: !!id,
  });

  return {
    agent: data || null,
    isLoading,
    error: error?.message || null,
  };
};
