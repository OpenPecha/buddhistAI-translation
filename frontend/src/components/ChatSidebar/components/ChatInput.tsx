import { Brain, Send, X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";
import { useTranslation as useTranslationI18next } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/components/ChatSidebar/contexts/TranslationContext";
import { useModels } from "@/hooks/useModels";

import { type ModelName } from "@/api/translate";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  isProcessing?: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  isProcessing = false,
  disabled = false,
}) => {
  const { t } = useTranslationI18next();
  const [input, setInput] = useState("");
  const {
    isTranslating,
    startTranslation,
    config,
    handleConfigChange,
    selectedAgentId,
    selectedText,
    clearSelection,
  } = useTranslation();

  const {
    models,
    isLoading: isLoadingModels,
  } = useModels();

  const handleSend = useCallback(() => {
    if (disabled || isTranslating || !selectedAgentId || !selectedText?.trim()) return;

    const instructionText = input.trim();
    startTranslation(instructionText || undefined);
    setInput("");
  }, [input, disabled, isTranslating, selectedAgentId, selectedText, startTranslation]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);

      const textarea = e.target;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    },
    []
  );
  return (
    <div className="p-2">
      <div className="flex gap-2 items-center flex-col">
        <div className="w-full rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
          {selectedText && (
            <div className="flex items-center gap-1 px-2 pt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 max-w-[90%] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded-md px-2 py-1">
                <span className="truncate max-w-[200px]">{selectedText}</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="hover:text-red-500 flex-shrink-0 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={selectedText ? "Add instructions (optional)..." : t("translation.selectTextPlaceholder", "Select text to translate...")}
            disabled={disabled || isProcessing || isTranslating || !selectedText}
            className="resize-none border-0 focus-visible:ring-0 shadow-none"
          />
        </div>
        <div className="flex justify-between w-full">
          <Select
            value={config.modelName}
            onValueChange={(value: string) =>
              handleConfigChange("modelName", value as ModelName)
            }
            disabled={disabled || isProcessing || isTranslating || isLoadingModels}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder={isLoadingModels ? "Loading..." : "Select model"} />
            </SelectTrigger>
            <SelectContent>
              {models.length > 0 ? (
                models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.is_thinking && <Brain className="size-4" />}
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-gray-500">{model.provider}</span>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-models" disabled>
                  No models available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleSend}
            variant="outline"
            disabled={
              disabled || !selectedText?.trim() || isProcessing || isTranslating || !selectedAgentId
            }
            size="icon"
            title="Translate text (Enter)"
          >
            <Send className="size-4 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
