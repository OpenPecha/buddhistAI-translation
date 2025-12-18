import React, { useState } from "react";
import SelectTranslation from "./SelectTranslation";
import { IoIosArrowForward } from "react-icons/io";
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
    <div className="h-full flex group relative w-full">
      {/* Line container */}
      <div className="relative h-full">
        {/* Vertical Line (hidden by default, shows on hover except on mobile) */}
        <div
          className="absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2 
          opacity-100 
          sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover/content:opacity-100
          transition-opacity duration-200"
        />
      </div>

      {/* Content area */}
      <div className="group/content p-4 w-full">{children}</div>
    </div>
  );
}

export default SideMenu;
