import { getHeaders } from "../utils";

const server_url = import.meta.env.VITE_SERVER_URL;

export interface TokenizeRequest {
  text: string;
  type: "word" | "sentence";
}

export interface TokenizeResponse {
  // The response structure will depend on what the external API returns
  // This is a placeholder - adjust based on actual API response
  [key: string]: unknown;
}

/**
 * Tokenize text using the backend tokenization API
 * @param request - Tokenization request parameters
 * @returns Tokenization response from the API
 * @throws Error if the request fails
 */
export const tokenize = async (
  request: TokenizeRequest
): Promise<TokenizeResponse> => {
  try {
    const response = await fetch(`${server_url}/tokenize`, {
      method: "POST",
      headers: {
        accept: "application/json",
        ...getHeaders(),
      },
      body: JSON.stringify({
        text: request.text,
        type: request.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to tokenize text: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error tokenizing text:", error);
    throw error;
  }
};
