import {
  MessageCircle,
  BookOpen,
  FileText,
  Upload,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import TableOfContent from "../TableOfContent";
import Resources from "../EditorSideMenu/Resources";
import { useEditorSidebarStore } from "@/stores/editorSidebarStore";
import CommentSidebar from "../Comment/CommentSidebar";
import { ScrollArea } from "../ui/scroll-area";
import { useCommentStore } from "@/stores/commentStore";
import { useSelectionStore } from "@/stores/selectionStore";
import ChatSidebar from "../ChatSidebar";
import UploadContent from "./UploadContent";
import SidebarTabs from "./SidebarTabs";
import SidebarHeader from "./SidebarHeader";
import { useCurrentDoc } from "@/hooks/useCurrentDoc";

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
  const { currentDoc } = useCurrentDoc(documentId);
  const isFromPecha = !!(currentDoc?.metadata?.textId ?? currentDoc?.metadata?.text_id);
  const { getSidebarView, setSidebarView, setActiveThreadId } =
    useCommentStore();
  const setLineFocus = useSelectionStore((state) => state.setLineFocus);
  const sidebarView = getSidebarView(documentId);

  const tabs = [
    {
      id: "toc",
      icon: BookOpen,
      label: t(`editor.tableOfContents`),
      shortLabel: "Contents",
    },
    {
      id: "comments",
      icon: MessageCircle,
      label: t(`common.comments`),
      shortLabel: "Comments",
    },
    ...(!isTranslationEditor && isFromPecha
      ? [
        {
          id: "resources",
          icon: FileText,
          label: t(`common.resources`),
          shortLabel: "Resources",
        },
      ]
      : []),
    ...(isTranslationEditor
      ? [
        {
          id: "skill",
          icon: Sparkles,
          label: t(`translation.aiTranslation`),
          shortLabel: "Skill",
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
      className={`flex h-full ${isTranslationEditor ? "flex-row-reverse" : ""
        } border-r border-l overflow-hidden`}
    >
      {!activeTab && (
        <div
          role="toolbar"
          className=" bg-gray-50/50 dark:bg-card flex flex-col"
        >
          <SidebarTabs
            tabs={tabs}
            onTabClick={(tabId) => toggleTab(documentId, tabId)}
          />
        </div>
      )}

      {/* Content Panel */}
      {activeTab && (
        <div
          className={`w-80 bg-white dark:bg-card flex flex-col transition-all duration-300`}
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
              setLineFocus(documentId, null);
            }}
          />
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "toc" && (
              <TableOfContent documentId={documentId} />
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

            {activeTab === "skill" && isTranslationEditor && (
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
