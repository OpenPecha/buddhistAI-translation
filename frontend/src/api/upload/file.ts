import { getHeadersMultipart } from "../utils";

const server_url = import.meta.env.VITE_SERVER_URL;

/**
 * Response from S3 upload API
 */
export interface S3UploadResponse {
  success: boolean;
  message: string;
  data: {
    location: string;
    bucket: string;
    key: string;
    etag: string;
    url?: string; // Present for public uploads
  };
}

/**
 * Response from multiple files upload API
 */
export interface S3MultipleUploadResponse {
  success: boolean;
  message: string;
  data: Array<{
    location: string;
    bucket: string;
    key: string;
    etag: string;
    url?: string; // Present for public uploads
  }>;
}

/**
 * Options for file upload
 */
export interface UploadFileOptions {
  /** Optional path/folder in S3 (e.g., "documents/", "images/") */
  path?: string;
  /** Whether to make the file publicly accessible */
  public?: boolean;
  /** Optional callback for upload progress (not supported by current API, but included for future use) */
  onProgress?: (progress: number) => void;
  /** Translation ID to associate uploaded files with */
  translationId?: string;
}

/**
 * Upload a single file to S3
 * @param file - The file to upload (File object or Blob)
 * @param options - Upload options (path, public access, etc.)
 * @returns Promise that resolves to the upload response with S3 location URL
 * @throws Error if the upload fails
 */
export const uploadFileToS3 = async (
  file: File | Blob,
  options: UploadFileOptions = {}
): Promise<S3UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    if (options.path) {
      formData.append("path", options.path);
    }

    if (options.public !== undefined) {
      formData.append("public", options.public.toString());
    }

    const response = await fetch(`${server_url}/upload-file`, {
      method: "POST",
      headers: getHeadersMultipart(), // Don't set Content-Type, let browser set it with boundary
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Failed to upload file: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};

/**
 * Upload multiple files to S3
 * @param files - Array of files to upload (File objects or Blobs)
 * @param options - Upload options (path, public access, etc.)
 * @returns Promise that resolves to the upload response with array of S3 location URLs
 * @throws Error if the upload fails
 */
export const uploadMultipleFilesToS3 = async (
  files: Array<File | Blob>,
  options: UploadFileOptions = {}
): Promise<S3MultipleUploadResponse> => {
  try {
    if (files.length === 0) {
      throw new Error("At least one file is required");
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (options.path) {
      formData.append("path", options.path);
    }

    if (options.public !== undefined) {
      formData.append("public", options.public.toString());
    }

    if (options.translationId) {
      formData.append("translationId", options.translationId);
    }

    const response = await fetch(`${server_url}/upload-file/multiple`, {
      method: "POST",
      headers: getHeadersMultipart(), // Don't set Content-Type, let browser set it with boundary
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          `Failed to upload files: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading files to S3:", error);
    throw error;
  }
};
