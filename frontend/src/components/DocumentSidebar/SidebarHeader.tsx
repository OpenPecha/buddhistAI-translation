import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTab } from "./types";

interface SidebarHeaderProps {
  tabs: SidebarTab[];
  activeTab: string | null;
  onTabClick: (tabId: string) => void;
  onClose: () => void;
  isTranslationEditor: boolean;
  sidebarView: "list" | "thread" | "new";
  onBack: () => void;
}

const SidebarHeader = ({
  tabs,
  activeTab,
  onTabClick,
  onClose,
  isTranslationEditor,
  sidebarView,
  onBack,
}: SidebarHeaderProps) => {
  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 border-b bg-gray-50/50 dark:bg-zinc-800/50">
      <div
        className="flex items-center gap-1"
      >
        {activeTab === "comments" && (sidebarView === "thread" || sidebarView === "new") ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Back to threads"
            >
              {isTranslationEditor ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </Button>
            <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200">
              Thread
            </h3>
          </>
        ) : (
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => onTabClick(tab.id)}
                  title={tab.label}
                  className={
                    isActive
                      ? "bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }
                >
                  <Icon className="size-4" />
                </Button>
              );
            })}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        title="Close sidebar"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SidebarHeader;
