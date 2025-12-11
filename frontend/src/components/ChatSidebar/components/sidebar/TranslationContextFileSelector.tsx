import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Upload, FileText, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslationConfig } from "../../hooks";
import { Button } from "@/components/ui/button";
import React, { useRef, useState, useEffect } from "react";
import { uploadMultipleFilesToS3 } from "@/api/upload/file";
import { useSearchParams } from "react-router-dom";
import useTranslationContext from "../../hooks/userTranslationContext";
import { useQueryClient } from "@tanstack/react-query";
import { deleteTranslationContextFile } from "@/api/document";

interface TranslationContextFile {
  id: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  geminiFileId?: string;
  extractedText?: string;
  createdAt: string;
  updatedAt: string;
  documentId: string;
}

interface TargetLanguageProps {
  config: TranslationConfig;
  onConfigChange: <K extends keyof TranslationConfig>(
    key: K,
    value: TranslationConfig[K]
  ) => void;
}

interface FileWithContext extends File {
  contextFileId?: string;
  storageUrl?: string;
}

/**
 * Extract filename from S3 storage URL
 * S3 URLs typically look like: https://bucket.s3.region.amazonaws.com/path/filename-1234567890-uuid.ext
 */
const extractFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const filename = pathParts.at(-1) || "";
    // Remove timestamp and UUID if present (format: name-timestamp-uuid.ext)
    // Try to extract original filename by removing the last two segments before extension
    const parts = filename.split("-");
    if (parts.length >= 3) {
      // Likely has timestamp and UUID, try to reconstruct original name
      const lastPart = parts.at(-1) || "";
      const ext = lastPart.split(".").pop();
      const baseName = parts.slice(0, -2).join("-");
      return ext ? `${baseName}.${ext}` : filename;
    }
    return filename || "unknown-file";
  } catch {
    // Fallback: extract from pathname or use last part
    const parts = url.split("/");
    return parts.at(-1) || "unknown-file";
  }
};

/**
 * Convert database TranslationContextFile to File-like object
 */
const createFileFromContext = (
  contextFile: TranslationContextFile
): FileWithContext => {
  const filename = extractFilenameFromUrl(contextFile.storageUrl);
  // Create a File-like object that matches the File interface
  // We can't create a real File without fetching the content, so we create a minimal representation
  const file = new File([], filename, {
    type: contextFile.mimeType,
  }) as FileWithContext;
  // Override size property since File constructor doesn't accept size
  Object.defineProperty(file, "size", {
    value: contextFile.sizeBytes,
    writable: false,
  });
  // Store the context file ID for reference
  file.contextFileId = contextFile.id;
  file.storageUrl = contextFile.storageUrl;
  return file;
};

const MAX_FILES = 5;

export const TranslationContextFileSelector: React.FC<TargetLanguageProps> = ({
  config,
  onConfigChange,
}) => {
  const { t } = useTranslation();
  const [searchQuery] = useSearchParams();
  const translationId = searchQuery.get("translation");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { data: translationContext, isLoading } = useTranslationContext(
    translationId!
  );
  const queryClient = useQueryClient();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize contextFiles from database when translationContext is loaded
  // Also sync when translationContext updates (e.g., after new files are uploaded)
  useEffect(() => {
    if (!translationId || isLoading) {
      return;
    }

    const dbFiles = (translationContext as TranslationContextFile[]) || [];
    const fileObjects = dbFiles.map(createFileFromContext);

    // Get current files from config
    const currentFiles = config.contextFiles || [];

    // Check if we need to sync
    const currentFileNames = currentFiles
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b));
    const dbFileNames = fileObjects
      .map((f) => f.name)
      .sort((a, b) => a.localeCompare(b));

    // Sync if:
    // 1. First initialization (hasInitialized is false)
    // 2. Database has more files than config (new files were uploaded)
    // 3. Database files are different from config files
    const needsSync =
      !hasInitialized ||
      dbFileNames.length > currentFileNames.length ||
      JSON.stringify(currentFileNames) !== JSON.stringify(dbFileNames);

    if (needsSync && !uploadingFiles.size) {
      // Only sync if no files are currently uploading
      onConfigChange("contextFiles", fileObjects);
      setHasInitialized(true);
    } else if (!hasInitialized) {
      // Mark as initialized even if no sync was needed
      setHasInitialized(true);
    }
  }, [
    translationContext,
    isLoading,
    hasInitialized,
    config.contextFiles,
    onConfigChange,
    translationId,
    uploadingFiles,
  ]);

  const uploadFiles = async (filesToUpload: File[]) => {
    const existingFiles = config.contextFiles || [];
    // Add files to config and mark as uploading
    onConfigChange("contextFiles", [...existingFiles, ...filesToUpload]);
    setUploadingFiles((prev) => {
      const newSet = new Set(prev);
      filesToUpload.forEach((file) => newSet.add(file.name));
      return newSet;
    });

    try {
      const response = await uploadMultipleFilesToS3(filesToUpload, {
        translationId: translationId || undefined,
      });

      // Invalidate and refetch translation context after successful upload
      if (translationId) {
        queryClient.invalidateQueries({
          queryKey: ["translationContext", translationId],
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      // Remove from uploading state
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        filesToUpload.forEach((file) => newSet.delete(file.name));
        return newSet;
      });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) {
      return;
    }

    const newFiles = Array.from(files);
    const existingFiles = config.contextFiles || [];
    const uniqueNewFiles = newFiles.filter(
      (newFile) =>
        !existingFiles.some(
          (existingFile) => existingFile.name === newFile.name
        )
    );

    // Check file limit
    const totalFilesAfterAdd = existingFiles.length + uniqueNewFiles.length;
    if (totalFilesAfterAdd > MAX_FILES) {
      const allowedNewFiles = uniqueNewFiles.slice(
        0,
        MAX_FILES - existingFiles.length
      );
      if (allowedNewFiles.length === 0) {
        setErrorMessage(
          `Maximum ${MAX_FILES} files allowed. Please remove some files before adding new ones.`
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      setErrorMessage(
        `Only ${allowedNewFiles.length} file(s) added. Maximum ${MAX_FILES} files allowed.`
      );
      setTimeout(() => setErrorMessage(null), 5000);
      await uploadFiles(allowedNewFiles);
      return;
    }

    // Clear any previous error messages
    setErrorMessage(null);
    await uploadFiles(uniqueNewFiles);
  };

  const handleRemoveFile = async (fileName: string) => {
    const fileToRemove = (config.contextFiles || []).find(
      (file) => file.name === fileName
    );

    if (!fileToRemove) {
      return;
    }

    // Check if this is a file from the database (has contextFileId)
    const fileWithContext = fileToRemove as FileWithContext;
    if (fileWithContext.contextFileId) {
      try {
        // Delete from database
        await deleteTranslationContextFile(fileWithContext.contextFileId);

        // Invalidate and refetch translation context
        if (translationId) {
          queryClient.invalidateQueries({
            queryKey: ["translationContext", translationId],
          });
        }
      } catch (error) {
        console.error("Error deleting translation context file:", error);
        // Still remove from UI even if API call fails
      }
    }

    // Remove from config state
    const updatedFiles = (config.contextFiles || []).filter(
      (file) => file.name !== fileName
    );
    onConfigChange("contextFiles", updatedFiles);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="user-rules"
          className="text-sm font-medium flex items-center gap-2"
        >
          <MessageSquare className="w-3 h-3" />
          {t("translation.translationGuidelines")}
        </Label>
        <Textarea
          id="user-rules"
          placeholder="Enter specific instructions for the AI translator (e.g., 'Maintain formal tone', 'Preserve technical terms', etc.)"
          value={config.userRules}
          onChange={(e) => onConfigChange("userRules", e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs">
          {t("translation.translationGuidelinesDescription")}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Upload className="w-3 h-3" />
          {t("translation.contextFiles")}
          <span className="text-xs text-muted-foreground ml-auto">
            {(config.contextFiles || []).length}/{MAX_FILES}
          </span>
        </Label>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.docx"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          className="w-full"
          disabled={(config.contextFiles || []).length >= MAX_FILES}
        >
          <Upload className="w-4 h-4 mr-2" />
          {t("translation.uploadFiles")}
        </Button>
        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
        <div className="space-y-2 mt-2">
          {(config.contextFiles || []).map((file) => {
            const isUploading = uploadingFiles.has(file.name);
            return (
              <div
                key={file.name}
                className="flex items-center justify-between bg-muted p-2 rounded-md text-sm"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemoveFile(file.name)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
        <p className="text-xs">{t("translation.contextFilesDescription")}</p>
      </div>
    </div>
  );
};
