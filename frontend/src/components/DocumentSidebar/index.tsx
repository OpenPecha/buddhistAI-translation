import {
  Info,
  MessageCircle,
  BookOpen,
  FileText,
  MessageSquare,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import TableOfContent from "../TableOfContent";
import Resources from "../EditorSideMenu/Resources";
import { useEditorSidebarStore } from "@/stores/editorSidebarStore";
import CommentSidebar from "../Comment/CommentSidebar";
import { ScrollArea } from "../ui/scroll-area";
import { useCommentStore } from "@/stores/commentStore";
import { useSelectionStore } from "@/stores/selectionStore";
import ChatSidebar from "../ChatSidebar";
import MetadataContent from "./MetadataContent";
import UploadContent from "./UploadContent";
import SidebarTabs from "./SidebarTabs";
import SidebarHeader from "./SidebarHeader";
import { RiGeminiLine } from "react-icons/ri";

interface DocumentSidebarProps {
  documentId: string;
  isTranslationEditor?: boolean;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  documentId,
  isTranslationEditor = false,
}) => {
  const { tabs: editorTabs, setTabs, toggleTab } = useEditorSidebarStore();
  const activeTab = editorTabs[documentId];
  const { t } = useTranslation();
  const { getSidebarView, setSidebarView, setActiveThreadId } =
    useCommentStore();
  const setLineFocus = useSelectionStore((state) => state.setLineFocus);
  const sidebarView = getSidebarView(documentId);
  const [isHovered, setIsHovered] = useState(false);

  const tabs = [
    {
      id: "toc",
      icon: BookOpen,
      label: t(`editor.tableOfContents`),
      shortLabel: "Contents",
    },
    {
      id: "metadata",
      icon: Info,
      label: t(`meta.documentInfo`),
      shortLabel: "Info",
    },
    {
      id: "comments",
      icon: MessageCircle,
      label: t(`common.comments`),
      shortLabel: "Comments",
    },
    ...(isTranslationEditor
      ? []
      : [
          {
            id: "resources",
            icon: FileText,
            label: t(`common.resources`),
            shortLabel: "Resources",
          },
        ]),
    ...(isTranslationEditor
      ? [
          {
            id: "translation",
            icon: RiGeminiLine,
            label: t(`translation.aiTranslation`),
            shortLabel: "Translator",
          },
          {
            id: "upload",
            icon: Upload,
            label: "Upload to OpenPecha",
            shortLabel: "Upload",
          },
        ]
      : []),
  ];

  return (
    <div
      className={`flex h-full ${
        isTranslationEditor ? "flex-row-reverse" : ""
      } border-r border-l overflow-hidden`}
    >
      {/* Vertical Icon Tabs - Only show when sidebar is closed */}
      {!activeTab && (
        <div
          role="toolbar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`group w-12 hover:w-40 transition-all duration-300 ${
            isTranslationEditor ? "border-l" : "border-r"
          } bg-gray-50/50 dark:bg-gray-900/20 flex flex-col`}
        >
          <SidebarTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={(tabId) => toggleTab(documentId, tabId)}
            isHovered={isHovered}
          />
        </div>
      )}

      {/* Content Panel */}
      {activeTab && (
        <div
          className={`w-80 bg-white dark:bg-gray-900 flex flex-col transition-all duration-300`}
        >
          <SidebarHeader
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={(tabId) => toggleTab(documentId, tabId)}
            onClose={() => setTabs(documentId, null)}
            isTranslationEditor={isTranslationEditor}
            sidebarView={sidebarView}
            onBack={() => {
              setSidebarView(documentId, "list");
              setActiveThreadId(documentId, null);
              // Clear the selection so auto-selection doesn't trigger
              setLineFocus(documentId, null);
            }}
          />

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "toc" && (
              <ScrollArea className="h-full">
                <div className="p-3">
                  <TableOfContent documentId={documentId} />
                </div>
              </ScrollArea>
            )}

            {activeTab === "metadata" && (
              <MetadataContent documentId={documentId} />
            )}

            {activeTab === "comments" && (
              <CommentSidebar
                documentId={documentId}
                isOpen={activeTab === "comments"}
              />
            )}

            {activeTab === "resources" && (
              <ScrollArea className="h-full">
                <div className="h-full">
                  <Resources />
                </div>
              </ScrollArea>
            )}

            {activeTab === "translation" && isTranslationEditor && (
              <div className="h-full">
                <ChatSidebar documentId={documentId} />
              </div>
            )}

            {activeTab === "upload" && isTranslationEditor && (
              <UploadContent
                documentId={documentId}
                onClose={() => setTabs(documentId, null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSidebar;
