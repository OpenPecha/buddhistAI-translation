import { getHeaders } from "./utils";
const server_url = import.meta.env.VITE_SERVER_URL;

// New OpenPecha API functions for the text loader
/**
 * Fetch list of texts from OpenPecha
 * @param options - Query parameters for filtering texts
 * @returns List of texts
 */
export const fetchTexts = async ({
  limit,
  offset,
  language,
  title,
}: {
  limit?: number;
  offset?: number;
  language?: string;
  title?: string;
}) => {
  const getUrl = () => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    if (language) params.append("language", language);
    if (title) params.append("title", title);
    return `${server_url}/openpecha/texts?${params.toString()}`;
  };
  const response = await fetch(getUrl(), {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch texts");
  }
  return response.json();
};

export const fetchText = async (textId: string) => {
  const response = await fetch(`${server_url}/openpecha/texts/${textId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch text");
  }
  return response.json();
};

export interface LinkedResource {
  instance_id: string;
  metadata: {
    instance_type: string;
    source: string;
    text_id: string;
    title: Record<string, string>;
    alt_titles: string[];
    language: string;
    contributions: unknown[];
  };
  annotation: string | null;
  relationship: string;
}

export const fetchLinkedResources = async (
  textId: string
): Promise<LinkedResource[]> => {
  const response = await fetch(
    `${server_url}/openpecha/texts/${textId}/linked-resources`,
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch linked resources");
  }
  return response.json();
};

export interface SegmentWithContent {
  segment_id: string;
  initialStartOffset: number;
  initialEndOffset: number;
  content: string;
}

/**
 * Fetch segment-related data with content combined in a single call
 * This function combines getSegmentRelated and getSegmentsContent into one API call
 * @param textId - Text ID
 * @param spanStart - Start position of the span
 * @param spanEnd - End position of the span
 * @param transfer - Transfer parameter (default: false)
 * @returns Array of segments with segment_id, offsets, and content
 */
export const fetchSegmentsWithContent = async (
  textId: string,
  spanStart: number,
  spanEnd: number
): Promise<SegmentWithContent[]> => {
  const response = await fetch(`${server_url}/openpecha/webhook`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      text_id: textId,
      span_start: spanStart,
      span_end: spanEnd,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch segments with content");
  }
  return response.json();
};
