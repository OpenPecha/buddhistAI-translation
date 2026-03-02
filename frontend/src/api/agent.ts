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

export interface AgentContext {
  id: string;
  content: string;
  pecha_title: string | null;
  pecha_text_id: string | null;
}

export interface AgentDetail {
  id: string;
  name: string;
  source_type: string;
  description: string;
  system_prompt: string;
  contexts: AgentContext[];
  created_by: string;
  system_assistance: boolean;
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

export const getAgentDetail = async (agentId: string): Promise<AgentDetail> => {
  const token = sessionStorage.getItem('id_token');
  
  const response = await fetch(`/agent/assistant/${agentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch agent detail: ${response.statusText}`);
  }

  const data: AgentDetail = await response.json();
  return data;
};

export default getAgents;
