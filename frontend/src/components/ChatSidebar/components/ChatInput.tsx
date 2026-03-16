import { Brain, Send } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
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
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  isProcessing = false,
  disabled = false,
  placeholder,
}) => {
  const { t } = useTranslationI18next();
  const [input, setInput] = useState("");
  const [shouldStartTranslation, setShouldStartTranslation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder =
    placeholder || t("translation.typePasteTextPlaceholder");
  const {
    isTranslating,
    resetTranslations,
    resetGlossary,
    setManualText,
    setInputMode,
    startTranslation,
    manualText,
    inputMode,
    clearUISelection,
    config,
    handleConfigChange,
    selectedAgentId,
    selectedText,
  } = useTranslation();

  const {
    models,
    isLoading: isLoadingModels,
  } = useModels();

  // Effect to start translation when manual text is set from ChatInput
  useEffect(() => {
    if (
      shouldStartTranslation &&
      inputMode === "manual" &&
      manualText.trim() &&
      !isTranslating
    ) {
      setShouldStartTranslation(false);
      resetTranslations();
      resetGlossary();
      startTranslation();
    }
  }, [
    shouldStartTranslation,
    inputMode,
    manualText,
    isTranslating,
    resetTranslations,
    resetGlossary,
    startTranslation,
  ]);
  const handleSend = useCallback(() => {
    if (disabled || isTranslating || !selectedAgentId) return;

    const text = input.trim();

    if (text) {
      setInputMode("manual");
      setManualText(text);
      setShouldStartTranslation(true);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } else if (selectedText?.trim()) {
      setInputMode("selection");
      resetTranslations();
      resetGlossary();
      startTranslation();
    }
  }, [input, disabled, isTranslating, selectedAgentId, selectedText, setInputMode, setManualText, resetTranslations, resetGlossary, startTranslation]);

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
  const handleFocus = () => {
    clearUISelection();
  };

  return (
    <div className="p-2">
      <div className="flex gap-2 items-center flex-col">
        <Textarea
          value={input}
          onFocus={handleFocus}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={defaultPlaceholder}
          disabled={disabled || isProcessing || isTranslating || !!selectedText?.trim()}
          className="resize-none"
        />
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
              disabled || (!input.trim() && !selectedText?.trim()) || isProcessing || isTranslating || !selectedAgentId
            }
            size="icon"
            title="Translate text (Enter)"
          >
            <Send className="size-4 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
