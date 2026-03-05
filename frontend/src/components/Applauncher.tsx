import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LayoutGrid } from "lucide-react";
import { useFetchTools } from "@/api/queries/other";
import { Button } from "./ui/button";

interface Tool {
  name: string;
  link: string;
  icon: string;
}

const AppLauncher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { data: toolList, isLoading } = useFetchTools();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
        >
          <LayoutGrid size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
      >
        <div className="grid grid-cols-3">
          {isLoading && <div>Loading...</div>}
          {toolList?.map((app: Tool) => (
            <a
              key={app.link}
              href={app.link}
              target="_blank"
              className="flex flex-col dark:hover:bg-zinc-800 hover:bg-zinc-100 p-1 rounded-md items-center justify-center font-sans"
            >
              <img src={app.icon} alt={app.name} className="w-6 h-6" />
              <span className="text-xs text-center">{app.name}</span>
            </a>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AppLauncher;
