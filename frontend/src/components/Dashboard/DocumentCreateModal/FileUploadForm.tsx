import React, { useState } from "react";
import SelectLanguage from "./SelectLanguage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TextUploader from "./TextUploader";
import { createProject } from "@/api/project";
import { createDocument } from "@/api/document";
import { ErrorDisplay } from "@/components/shared/modals";
import { DEFAULT_LANGUAGE_SELECTED } from "@/config";
import { createEmptyTranslationFormData } from "@/utils/documentUtils";

interface FileUploadFormProps {
  readonly projectName: string;
  readonly closeOnSuccess: () => void;
  readonly onValidationChange?: (isValid: boolean) => void;
  readonly onCreateProject?: React.MutableRefObject<
    (() => void | Promise<void>) | null
  >;
  readonly setNewDocumentId: (id: string | null) => void;
}

export function FileUploadForm({
  projectName,
  closeOnSuccess,
  onValidationChange,
  onCreateProject,
  setNewDocumentId,
}: FileUploadFormProps) {
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    DEFAULT_LANGUAGE_SELECTED
  );
  const [rootId, setRootId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Notify parent about validation state
  const isValid = !!(rootId && selectedLanguage && selectedLanguage !== "");

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  React.useEffect(() => {
    setNewDocumentId(rootId);
  }, [rootId, setNewDocumentId]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!projectName) {
        throw new Error("Project name is required");
      }

      const projectResponse = await createProject({
        name: projectName,
        identifier: projectName.toLowerCase().replace(/\s+/g, "-"),
        rootId: rootId ?? undefined,
      });

      if (!rootId) {
        throw new Error("Root document ID is required");
      }

      const translationFormData = createEmptyTranslationFormData(rootId);
      const translationResponse = await createDocument(translationFormData);

      return {
        project: projectResponse,
        translationId: translationResponse.data?.id || translationResponse.id,
      };
    },
    onSuccess: ({ project, translationId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      const docId = project.data.roots[0].id;
      closeOnSuccess();
      window.location.href = `/documents/${docId}?translation=${translationId}`;
    },
    onError: (error: Error) => {
      setError(error.message || "Failed to create project");
    },
  });

  const handleCreateProject = React.useCallback(async () => {
    if (!projectName) {
      setError("Project name is required");
      return;
    }
    setError("");
    try {
      await createProjectMutation.mutateAsync();
    } catch {
      // Error already surfaced via onError; swallow to avoid unhandled rejection
    }
  }, [projectName, createProjectMutation]);

  React.useEffect(() => {
    if (onCreateProject) {
      (
        onCreateProject as React.MutableRefObject<
          (() => void | Promise<void>) | null
        >
      ).current = handleCreateProject;
    }
  }, [handleCreateProject, onCreateProject]);

  return (
    <div className="space-y-8">
      <ErrorDisplay error={error} />
      <SelectLanguage
        setSelectedLanguage={setSelectedLanguage}
        selectedLanguage={selectedLanguage}
      />

      {selectedLanguage && (
        <>
          <TextUploader
            isRoot={true}
            isPublic={false}
            selectedLanguage={selectedLanguage}
            setRootId={setRootId}
            disable={!selectedLanguage || selectedLanguage === ""}
            setNewDocumentId={setNewDocumentId}
          />
        </>
      )}
    </div>
  );
}

