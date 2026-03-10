import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Trash2, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { deleteDocument, updateDocument } from "@/api/document";
import { useTranslationSidebarParams } from "@/hooks/useQueryParams";
import { languages } from "@/utils/Constants";
import type { Translation } from "../../DocumentWrapper";
import TranslationMenu from "./TranslationMenu";
import { Button } from "@/components/ui/button";

interface TranslationItemProps {
  translation: Translation;
}

const TranslationItem: React.FC<TranslationItemProps> = ({ translation }) => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const rootId = id as string;
  const { setSelectedTranslationId } = useTranslationSidebarParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  // Helper function to render the status indicator
  const refetchTranslations = () =>
    queryClient.invalidateQueries({
      queryKey: [`translations-${rootId}`],
    });

  // Helper function to get language info
  const getLanguageInfo = (languageCode: string) => {
    const languageInfo = languages.find((lang) => lang.code === languageCode);
    return (
      languageInfo || { code: languageCode, name: languageCode, colorcode: "#12A7FC" }
    );
  };

  const deleteTranslationMutation = useMutation({
    mutationFn: (translationId: string) => deleteDocument(translationId),
    onSuccess: () => {
      // Refresh document data and translations list
      refetchTranslations();
      // Clear the deleting state
    },
    onError: (error) => {
      console.error(t("translation.errorDeletingTranslation"), error);
      // Clear the deleting state on error too
      window.alert(
        `Error: ${error instanceof Error
          ? error.message
          : t("translation.failedToDeleteTranslation")
        }`
      );
    },
  });

  // Set up mutation for updating document
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      language?: string;
    }) => {
      if (!id) throw new Error("Document ID not found");
      // Update the document name and/or language
      const updateData: any = { content: undefined };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.language !== undefined) updateData.language = data.language;

      return await updateDocument(data.id, updateData);
    },
    onSuccess: () => {
      // Invalidate and refetch document data and translations
      refetchTranslations();
    },
    onError: (error) => {
      console.error(t("translation.failedToUpdateDocument"), error);
    },
  });
  const isDeleting = deleteTranslationMutation.isPending;
  const isUpdating = updateDocumentMutation.isPending;
  const disabled = isDeleting || isUpdating;
  const onEdit = (translationId: string, name?: string, language?: string) => {
    // Implement edit functionality here
    const updateData: { id: string; name?: string; language?: string } = {
      id: translationId,
    };
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;
    updateDocumentMutation.mutate(updateData);
  };
  const onDelete = (translationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (
      window.confirm(t("translation.areYouSureYouWantToDeleteThisTranslation"))
    ) {
      // Set the deleting state before starting the mutation
      deleteTranslationMutation.mutate(translationId);
    }
  };

  return (
    <div
      key={translation.id}
      className="group flex justify-between items-center"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          if (!disabled && !isModalOpen) {
            setSelectedTranslationId(translation.id);
          }
        }}
        className="pl-0 rounded-none"
        aria-label={`Open translation ${translation.id}`}
        disabled={disabled}
      >
        <div className="w-3 h-3" style={{ backgroundColor: getLanguageInfo(translation.language).colorcode }} />
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="truncate">{translation.name}</div>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="capitalize">
              {getLanguageInfo(translation.language).name}
            </span>
            <span>
              <RenderStatusIndicator isDeleting={isDeleting} />
            </span>
          </div>
        </div>
      </Button>
      {isDeleting || isUpdating ? (
        <Loader2 className="animate-spin" />
      ) : (
        <TranslationMenu
          translation={translation}
          onEdit={(name, language) => onEdit(translation.id, name, language)}
          onDelete={(e) => onDelete(translation.id, e)}
          onModalOpenChange={setIsModalOpen}
        />
      )}
    </div>
  );
};

function RenderStatusIndicator({
  isDeleting,
}: {
  readonly isDeleting: boolean;
}) {
  if (isDeleting) {
    return (
      <>
        <Trash2 className="h-3 w-3 mr-1 animate-pulse text-red-500" />
        <span className="text-red-500 dark:text-red-400">Deleting...</span>
      </>
    );
  }
  return null;
}
export default TranslationItem;
