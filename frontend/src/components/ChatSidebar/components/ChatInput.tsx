import { Send } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation as useTranslationI18next } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/ui/ModelSelector";
import { useTranslation } from "@/components/ChatSidebar/contexts/TranslationContext";

import { type ModelName } from "@/api/translate";

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
  } = useTranslation();

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
    const text = input.trim();
    if (text && !disabled && !isTranslating) {
      // Set the text in manual mode and flag for translation
      setInputMode("manual");
      setManualText(text);
      setShouldStartTranslation(true);

      // Clear input immediately
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [input, disabled, isTranslating, setInputMode, setManualText]);

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

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height before scrolling
      textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
    },
    []
  );
  const handleFocus = () => {
    clearUISelection();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="p-3">
        <div className="flex gap-2 items-center flex-col">
          <textarea
            ref={textareaRef}
            value={input}
            onFocus={handleFocus}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={defaultPlaceholder}
            disabled={disabled || isProcessing || isTranslating}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-sm px-3 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-[40px] max-h-[120px]"
            rows={3}
          />
          <div className="flex justify-between w-full">
            <ModelSelector
              value={config.modelName}
              onValueChange={(value: ModelName) =>
                handleConfigChange("modelName", value)
              }
              disabled={disabled || isProcessing || isTranslating}
              size="sm"
              showIcon={false}
              displayStyle="simple"
            />
            <Button
              onClick={handleSend}
              variant="outline"
              disabled={
                disabled || !input.trim() || isProcessing || isTranslating
              }
              size="icon"
              title="Translate text (Enter)"
            >
              <Send className="size-4 text-gray-600" />
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
