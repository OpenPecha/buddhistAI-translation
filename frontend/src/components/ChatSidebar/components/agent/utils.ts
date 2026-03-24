import type { LinkedResource } from "@/api/openpecha";

export function extractPromptVariables(
  userPrompt: string,
  linkedResources: LinkedResource[] | undefined
): Record<string, string>[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: Record<string, string>[] = [];
  let match;
  while ((match = variableRegex.exec(userPrompt)) !== null) {
    const instanceId = match[1];
    const resource = linkedResources?.find(
      (r) => r.instance_id === instanceId
    );
    if (resource) {
      variables.push({ instanceId });
    }
  }
  return variables;
}

