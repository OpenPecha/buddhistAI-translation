import React, { useState } from "react";
import SelectLanguage from "./SelectLanguage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "@/api/project";
import { createDocument, createDocumentWithContent } from "@/api/document";
import { ErrorDisplay } from "@/components/shared/modals";
import { DEFAULT_LANGUAGE_SELECTED } from "@/config";
import { createEmptyTranslationFormData } from "@/utils/documentUtils";

interface EmptyTextFormProps {
  readonly projectName: string;
  readonly closeOnSuccess: () => void;
  readonly onValidationChange?: (isValid: boolean) => void;
  readonly onCreateProject?: React.MutableRefObject<
    (() => void | Promise<void>) | null
  >;
}

export function EmptyTextForm({
  projectName,
  closeOnSuccess,
  onValidationChange,
  onCreateProject,
}: EmptyTextFormProps) {
  const [error, setError] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    DEFAULT_LANGUAGE_SELECTED
  );
  const queryClient = useQueryClient();

  // Valid if language is selected
  const isValid = !!(selectedLanguage && selectedLanguage !== "");

  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!projectName) throw new Error("Project name is required");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const documentData = {
        name: "EmptyText",
        identifier: `empty-text-${timestamp}`,
        isRoot: true,
        language: selectedLanguage,
        content: "",
      };

      const documentResponse = await createDocumentWithContent(documentData);
      if (!documentResponse?.id) {
        throw new Error("Failed to create document");
      }

      const projectResponse = await createProject({
        name: projectName,
        identifier: projectName.toLowerCase().replace(/\s+/g, "-"),
        rootId: documentResponse.id,
        metadata: {
          source: "empty",
          language: selectedLanguage,
        },
      });

      const translationFormData = createEmptyTranslationFormData(documentResponse.id);
      const translationResponse = await createDocument(translationFormData);

      return {
        project: projectResponse,
        translationId: translationResponse.data?.id || translationResponse.id,
      };
    },
    onSuccess: ({ project, translationId }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      const rootId = project.data.roots[0].id;
      closeOnSuccess();
      window.location.href = `/documents/${rootId}?translation=${translationId}`;
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
    if (!selectedLanguage || selectedLanguage === "") {
      setError("Please select a language");
      return;
    }
    setError("");
    try {
      await createProjectMutation.mutateAsync();
    } catch {
      // Error already surfaced via onError; swallow to avoid unhandled rejection
    }
  }, [projectName, selectedLanguage, createProjectMutation]);

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
      <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
        <p className="text-sm">
          Empty text project will be created with the selected language.
        </p>
      </div>
    </div>
  );
}

