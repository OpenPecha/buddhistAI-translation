import React, { useState } from "react";
import SelectTranslation from "./SelectTranslation";
import { cn } from "@/lib/utils";

type MenuOption =
  | "translations"
  | "main"
  | "comments"
  | "commentary"
  | "footnotes";

function SideMenu() {
  const [currentView, setCurrentView] = useState<MenuOption>("main");
  const reset = () => {
    setCurrentView("main");
  };

  return (
    <div
      style={{
        width: currentView === "main" ? "" : "calc(var(--spacing) * 84)",
      }}
    >
      <InMenuWrapper onBackClick={reset}>
        <SelectTranslation />
      </InMenuWrapper>
    </div>
  );
}

function InMenuWrapper({
  children,
  onBackClick,
}: {
  readonly children: React.ReactNode;
  readonly onBackClick: () => void;
}) {
  return (
    <div className="h-full flex group relative w-full border-l">
      <div className="group/content p-4 w-full">{children}</div>
    </div>
  );
}

export default SideMenu;
