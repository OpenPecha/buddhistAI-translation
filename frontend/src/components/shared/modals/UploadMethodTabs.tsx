import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { File, Cable } from "lucide-react";

export type UploadMethod = "file" | "openpecha" | "ai";

interface UploadMethodTabsProps {
  readonly activeMethod: UploadMethod;
  readonly onMethodChange: (method: UploadMethod) => void;
  readonly children: React.ReactNode;
  readonly availableMethods?: UploadMethod[];
  readonly className?: string;
}

interface TabConfig {
  value: UploadMethod;
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
  icon?: React.ReactNode;
}

export function UploadMethodTabs({
  activeMethod,
  onMethodChange,
  children,
  availableMethods,
  className,
}: UploadMethodTabsProps) {
  const { t } = useTranslation();

  const tabConfigs: Record<UploadMethod, TabConfig> = {
    file: {
      value: "file",
      label: t("common.file"),
    },
    openpecha: {
      value: "openpecha",
      label: t("common.openpecha"),
    },
    ai: {
      value: "ai",
      label: "AI Generate",
    },
  };

  const visibleTabs = availableMethods?.map((method) => tabConfigs[method]);
  if (!visibleTabs) return null;

  return (
    <Tabs
      value={activeMethod}
      onValueChange={(value) => onMethodChange(value as UploadMethod)}
      className={cn("w-full", className)}
      defaultValue={visibleTabs[0].value}
    >
      <TabsList
        className="relative h-auto w-full gap-1 bg-neutral-50 dark:bg-zinc-800 p-1 rounded-lg"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="w-full"
          >

            <span className="inline">{tab.label}</span>
            {tab.comingSoon ||
              (tab.disabled && (
                <span className="ml-1 text-xs text-amber-500 font-normal">
                  (Soon)
                </span>
              ))}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-4">{children}</div>
    </Tabs>
  );
}

interface TabContentWrapperProps {
  readonly value: UploadMethod;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function TabContentWrapper({
  value,
  children,
  className,
}: TabContentWrapperProps) {
  return (
    <TabsContent
      value={value}
      className={cn(
        className
      )}
    >
      {children}
    </TabsContent>
  );
}
