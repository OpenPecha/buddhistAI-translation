import { EllipsisVertical, Eye, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import TargetLanguageSelector from "./components/sidebar/TranslationLanguageSelector";
import {
  TranslationProvider,
  useTranslation,
} from "./contexts/TranslationContext";
import ChatHistory from "./components/ChatHistory";
import ChatInput from "./components/ChatInput";
import ResultsPanel from "./components/ResultsPanel";
import { useChatFlow } from "./hooks/useChatFlow";
import AgentSelector from "./components/agent/AgentSelector";
import AgentDetailModal from "./components/agent/AgentDetailModal";
import EditAgentModal from "./components/agent/EditAgentModal";
import { useDeleteAgent, useAgentDetail } from "@/api/queries/agents";
import type { TargetLanguage, ModelName } from "@/api/translate";

interface ChatSidebarProps {
  documentId: string;
}

const ChatSidebarContent: React.FC<{
  selectedAgentId: string | undefined;
  setSelectedAgentId: (id: string | undefined) => void;
}> = ({ selectedAgentId, setSelectedAgentId }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAgentDetailModalOpen, setIsAgentDetailModalOpen] = useState(false);
  const [isEditAgentModalOpen, setIsEditAgentModalOpen] = useState(false);
  const deleteMutation = useDeleteAgent();
  const { agent: selectedAgentDetail } = useAgentDetail(selectedAgentId);

  const { messages, clearHistory, messageCount, handleAction } = useChatFlow();
  const {
    config,
    handleConfigChange,
    isTranslating,
    isExtractingGlossary,
    isAnalyzingStandardization,
    resetTranslations,
    resetGlossary,
    translationResults,
    glossaryTerms,
    inconsistentTerms,
  } = useTranslation();
  useEffect(() => {
    if (selectedAgentDetail) {
      if (selectedAgentDetail.language) {
        handleConfigChange("targetLanguage", selectedAgentDetail.language as TargetLanguage);
      }
      if (selectedAgentDetail.model) {
        handleConfigChange("modelName", selectedAgentDetail.model as ModelName);
      }
    }
  }, [selectedAgentDetail]);

  const hasTranslationResults = translationResults.length > 0;
  const hasGlossaryResults = glossaryTerms.length > 0;
  const hasInconsistentTerms = Object.keys(inconsistentTerms).length > 0;
  const showPanel =
    hasTranslationResults ||
    hasGlossaryResults ||
    hasInconsistentTerms ||
    isTranslating ||
    isExtractingGlossary ||
    isAnalyzingStandardization;


  const handleDeleteAgent = useCallback(() => {
    if (!selectedAgentId) return;
    if (!globalThis.confirm("Are you sure you want to delete this skill? This action cannot be undone.")) return;

    deleteMutation.mutate(selectedAgentId, {
      onSuccess: () => {
        toast.success("Skill deleted successfully");
        setSelectedAgentId(undefined);
      },
      onError: (err) => {
        toast.error(`Failed to delete skill: ${err.message}`);
      },
    });
  }, [selectedAgentId, deleteMutation, setSelectedAgentId]);

  const handleClearChat = useCallback(() => {
    if (
      globalThis.confirm(
        "Are you sure you want to clear the chat history and reset all results?"
      )
    ) {
      clearHistory();
      resetTranslations();
      resetGlossary();
    }
  }, [clearHistory, resetTranslations, resetGlossary]);

  if (isCollapsed) {
    return (
      <div className="h-full w-12 flex flex-col bg-neutral-50 dark:bg-card border-l border-gray-200 dark:border-gray-700">
        <div className="p-2 flex flex-col items-center gap-4">
          <Button
            onClick={() => setIsCollapsed(false)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Open Chat Skill"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-card">
        <div className=" w-full">
          <AgentSelector
            value={selectedAgentId}
            onValueChange={setSelectedAgentId}
          />
        </div>
        <div>
          {messageCount > 0 && (
            <Button
              onClick={handleClearChat}
              variant="ghost"
              size="icon"
              className="w-6 h-6 hover:bg-gray-100 dark:hover:bg-card hover:text-red-600"
              title="Reset chat"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={!selectedAgentId}
                title={!selectedAgentId ? "Select a Skill first" : "Skill options"}
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAgentDetailModalOpen(true)}>
                <Eye className="size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditAgentModalOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDeleteAgent}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {showPanel ? (
          <ResultsPanel />
        ) : (

          <ChatHistory
            messages={messages}
            isProcessing={
              isTranslating ||
              isExtractingGlossary ||
              isAnalyzingStandardization
            }
            onAction={handleAction}
          />
        )}
        <div className="flex items-center gap-2 border-t justify-between p-2">
          <TargetLanguageSelector
            config={config}
            onConfigChange={handleConfigChange}
            showLabel={false}
          />
          {hasTranslationResults && !isTranslating && (
            <Button
              onClick={resetTranslations}
              variant="outline"
            >
              Clear
            </Button>
          )}
        </div>

        <ChatInput
          isProcessing={
            isTranslating || isExtractingGlossary || isAnalyzingStandardization
          }
        />
      </div>

      <AgentDetailModal
        agentId={selectedAgentId}
        open={isAgentDetailModalOpen}
        onOpenChange={setIsAgentDetailModalOpen}
      />
      <EditAgentModal
        agentId={selectedAgentId}
        open={isEditAgentModalOpen}
        onOpenChange={setIsEditAgentModalOpen}
      />
    </div>
  );
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({ documentId }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();

  return (
    <TranslationProvider documentId={documentId} selectedAgentId={selectedAgentId}>
      <ChatSidebarContent
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
      />
    </TranslationProvider>
  );
};

export default ChatSidebar;
