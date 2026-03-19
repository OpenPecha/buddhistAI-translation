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
      const textId = resource.metadata.text_id;
      variables.push({ textId, instanceId });
    }
  }
  return variables;
}

export interface SegmentIndices {
  start: number;
  end: number;
}

export function findTextSegment(fullText: string, selectedText: string): SegmentIndices | null {
  const startIndex = fullText.indexOf(selectedText);
  if (startIndex === -1) {
    return null; 
  }
  const endIndex = startIndex + selectedText.length-1;

  return {
    start: startIndex,
    end: endIndex,
  };
}
