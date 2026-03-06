import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage as ChatMessageType } from "../types/chatTypes";
import ActionableMessage from "./ActionableMessage";
import ChatMessage from "./ChatMessage";

interface ChatHistoryProps {
  messages: ChatMessageType[];
  isProcessing?: boolean;
  onAction: (action: string, message: ChatMessageType) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  isProcessing = false,
  onAction,
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const isScrolledToBottom =
        scrollContainer.scrollHeight - scrollContainer.clientHeight <=
        scrollContainer.scrollTop + 1;

      // Only auto-scroll if user is at the bottom or close to it
      if (isScrolledToBottom || messages.length === 1) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t("translation.welcomeToTranslator")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("translation.welcomeToTranslatorDescription")}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
    >
      {messages.map((message) =>
        message.actions ? (
          <ActionableMessage
            key={message.id}
            message={message}
            onAction={onAction}
          />
        ) : (
          <ChatMessage key={message.id} message={message} />
        )
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Processing...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
