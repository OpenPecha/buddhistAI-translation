export interface Agent {
  id: string;
  name: string;
  source_type: string | null;
  description: string | null;
  created_by: string;
  system_assistance: boolean;
}

export interface AgentsResponse {
  assistants: Agent[];
  skip: number;
  limit: number;
  total: number;
}

const getAgents = async (
  skip: number = 0,
  limit: number = 10
): Promise<AgentsResponse> => {
  const response = await fetch(
    `/agent/assistant?skip=${skip}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  const data: AgentsResponse = await response.json();
  return data;
};

export default getAgents;
