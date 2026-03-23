import { getIdToken } from "@/lib/auth";

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
  user_prompt: string;
  language: string;
  model: string;
  contexts: AgentContext[];
  created_by: string;
  system_assistance: boolean;
}
export interface AITranslationRequest {
  assistant_id: string;
  prompt: string[];
  target_language: string;
  model: string;
  segments?: {
    start: number;
    end: number;
  };
}

export interface AITranslationResult {
  output_text: string;
}

export interface AITranslationResponse {
  results: AITranslationResult[];
  metadata: {
    initialized_at: string;
    total_batches: number;
    completed_at: string;
    total_processing_time: number;
  };
  errors: string[];
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
  const token = await getIdToken();
  
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


export interface UpdateAgentRequest {
  name: string;
  description: string;
  system_prompt: string;
  user_prompt: string;
  language: string;
  model: string;
  contexts: {
    content: string | null;
    pecha_title: string | null;
    pecha_text_id: string | null;
  }[];
  system_assistance: boolean;
  variables?: Record<string, string>[];
}

export const deleteAgent = async (agentId: string): Promise<void> => {
  const token = await getIdToken();

  const response = await fetch(`/agent/assistant/${agentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete agent: ${response.statusText}`);
  }
};

export const updateAgent = async (
  agentId: string,
  data: UpdateAgentRequest
): Promise<AgentDetail> => {
  const token = await getIdToken();

  const response = await fetch(`/agent/assistant/${agentId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update agent: ${response.statusText}`);
  }

  return response.json();
};

export const performAITranslation = async (
  params: AITranslationRequest
): Promise<AITranslationResponse> => {
  const token = await getIdToken();

  const response = await fetch('/agent/ai', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. You don\'t have permission to use this service.');
    } else if (response.status >= 500) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    
    try {
      const errorData = await response.json();
      throw new Error(errorData.error ?? `Request failed with status ${response.status}`);
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  const data: AITranslationResponse = await response.json();
  return data;
};

export default getAgents;
