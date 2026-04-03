import { PanelRightClose } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarTabsProps {
  tabs: any[];
  activeTab?: string | null;
  onTabClick: (tabId: string) => void;
  onClose?: () => void;
}

const SidebarTabs = ({ tabs, activeTab, onTabClick, onClose }: SidebarTabsProps) => {
  return (
    <TooltipProvider delayDuration={500}>
      <div className="flex flex-col items-center gap-0.5 py-2 w-10">
        {onClose && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-150"
                  aria-label="Close translation view"
                >
                  <PanelRightClose className="size-[15px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Close
              </TooltipContent>
            </Tooltip>
            <div className="w-5 h-px bg-gray-200 dark:bg-zinc-700 my-1" />
          </>
        )}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabClick(tab.id)}
                  className={`relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 ${isActive
                    ? "bg-gray-100 border border-gray-200 dark:border-blue-500 dark:bg-zinc-700 text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-zinc-700/60"
                    }`}
                  aria-label={tab.label}
                >
                  <Icon className="size-[15px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {tab.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SidebarTabs;
