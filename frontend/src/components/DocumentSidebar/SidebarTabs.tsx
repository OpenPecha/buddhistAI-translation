import { Button } from "@/components/ui/button";

interface SidebarTabsProps {
  tabs: any[];
  onTabClick: (tabId: string) => void;
}

const SidebarTabs = ({
  tabs,
  onTabClick,
}: SidebarTabsProps) => {
  return (
    <div className="flex flex-col gap-1 p-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => onTabClick(tab.id)}
            className="flex items-center justify-start"
          >
            <Icon className="size-4" />
            <p className="text-sm whitespace-nowrap">
              {tab.shortLabel}
            </p>
          </Button>
        );
      })}
    </div>
  );
};

export default SidebarTabs;
