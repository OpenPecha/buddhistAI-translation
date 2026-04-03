import { getAccessToken } from "@/lib/auth";

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
  instruction?: string;
}

export interface FuzzyMatch {
  source_text: string;
  target_text: string;
  score: number;
  model_name?: string;
}

export interface AITranslationResult {
  output_text: string;
  from_memory: boolean;
  fuzzy_matches: FuzzyMatch[];
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

const getAuthHeader = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Authentication token unavailable. Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};


const getAgents = async (
  skip: number = 0,
  limit: number = 10
): Promise<AgentsResponse> => {
  const authHeader = await getAuthHeader();
  const response = await fetch(
    `/agent/assistant?skip=${skip}&limit=${limit}`,
    {
      headers: {
        ...authHeader,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.statusText}`);
  }

  const data: AgentsResponse = await response.json();
  return data;
};

export const getAgentDetail = async (agentId: string): Promise<AgentDetail> => {
  const authHeader = await getAuthHeader();
  
  const response = await fetch(`/agent/assistant/${agentId}`, {
    headers: {
      ...authHeader,
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
  const authHeader = await getAuthHeader();

  const response = await fetch(`/agent/assistant/${agentId}`, {
    method: 'DELETE',
    headers: {
      ...authHeader,
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
  const authHeader = await getAuthHeader();

  const response = await fetch(`/agent/assistant/${agentId}`, {
    method: 'PUT',
    headers: {
      ...authHeader,
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
  const authHeader = await getAuthHeader();

  const response = await fetch('/agent/ai', {
    method: 'POST',
    headers: {
      ...authHeader,
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

export interface EnhancePromptResponse {
  enhanced_prompt: string;
}

export const enhanceSystemPrompt = async (
  prompt: string
): Promise<EnhancePromptResponse> => {
  const authHeader = await getAuthHeader();

  const response = await fetch('/agent/ai/enhance', {
    method: 'POST',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail?.message || error.detail || 'Failed to enhance prompt');
  }

  return response.json();
};

export const exportAgent = async (agentId: string): Promise<void> => {
  const authHeader = await getAuthHeader();

  const response = await fetch(`/agent/assistant/${agentId}/export`, {
    headers: {
      ...authHeader,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export agent: ${response.statusText}`);
  }

  const disposition = response.headers.get("Content-Disposition");
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] ?? `skill.md`;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default getAgents;
