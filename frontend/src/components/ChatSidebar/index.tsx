import { Info, MapPin, MessageSquare, Plus, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation as useTranslationI18next } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TargetLanguageSelector } from "./components/sidebar/SettingsModal";
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

interface ChatSidebarProps {
  documentId: string;
}

const ChatSidebarContent: React.FC = () => {
  const { t } = useTranslationI18next();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [isAgentDetailModalOpen, setIsAgentDetailModalOpen] = useState(false);

  const { messages, clearHistory, messageCount, handleAction } = useChatFlow();
  const {
    config,
    selectedText,
    handleConfigChange,
    isTranslating,
    isExtractingGlossary,
    isAnalyzingStandardization,
    selectedTextLineNumbers,
    clearSelection,
    resetTranslations,
    resetGlossary,
    translationResults,
    glossaryTerms,
    inconsistentTerms,
    inputMode,
  } = useTranslation();
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

  // Helper function to extract start and end line numbers from selectedTextLineNumbers
  const getLineRange = (
    lineNumbers: Record<string, { from: number; to: number }> | null
  ): { startLine: number; endLine: number } | null => {
    if (!lineNumbers) return null;

    const lineNums = Object.keys(lineNumbers)
      .map(Number)
      .sort((a, b) => a - b);
    if (lineNums.length === 0) return null;

    return {
      startLine: lineNums[0],
      endLine: lineNums.at(-1)!,
    };
  };

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
            title="Open Chat Assistant"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const selectedLines =
    getLineRange(selectedTextLineNumbers)?.startLine ===
      getLineRange(selectedTextLineNumbers)?.endLine
      ? `(${getLineRange(selectedTextLineNumbers)?.startLine})`
      : `(${getLineRange(selectedTextLineNumbers)?.startLine} - ${getLineRange(selectedTextLineNumbers)?.endLine
      })`;
  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-card">
        <div className="flex-1 mr-2">
          <AgentSelector
            value={selectedAgentId}
            onValueChange={setSelectedAgentId}
          />
        </div>
        <div className="">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAgentDetailModalOpen(true)}
            disabled={!selectedAgentId}
            title={!selectedAgentId ? "Select an agent to view details" : "View agent details"}
          >
            <Info />
          </Button>
        </div>
      </div>
      {/* Selected Text Display */}
      <TooltipProvider>
        {selectedText && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                    {t("translation.selectedText")} {selectedLines}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm text-blue-800 dark:text-blue-200 truncate">
                        {selectedText.trim().substring(0, 100)}...
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-xs max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="whitespace-pre-wrap break-words text-xs">
                        {selectedText}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={clearSelection}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1 text-blue-600 dark:text-blue-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                  title="Clear selected text"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </TooltipProvider>

      <div className="flex-1 flex flex-col min-h-0">
        {showPanel ? (
          <ResultsPanel inputMode={inputMode} />
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
        <TargetLanguageSelector
          config={config}
          onConfigChange={handleConfigChange}
          showLabel={false}
        />
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
    </div>
  );
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({ documentId }) => {
  return (
    <TranslationProvider documentId={documentId}>
      <ChatSidebarContent />
    </TranslationProvider>
  );
};

export default ChatSidebar;
