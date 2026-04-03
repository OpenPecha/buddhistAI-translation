import { PanelRightClose } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarTabsProps {
  tabs: any[];
  onTabClick: (tabId: string) => void;
  onClose?: () => void;
}

const SidebarTabs = ({ tabs, onTabClick, onClose }: SidebarTabsProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-center gap-1 px-1.5 py-2">
        {onClose && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-sm text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Close translation view"
              >
                <PanelRightClose className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs shadow-sm rounded-sm">
              Close translation
            </TooltipContent>
          </Tooltip>
        )}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabClick(tab.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  aria-label={tab.label}
                >
                  <Icon className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs shadow-sm rounded-sm">
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
