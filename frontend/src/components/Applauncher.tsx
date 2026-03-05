import React from "react";

import { LayoutGrid } from "lucide-react";
import { useFetchTools } from "@/api/queries/other";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";


const AppLauncher: React.FC = () => {
  const { data: toolList } = useFetchTools();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <LayoutGrid />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-fit space-y-2'>
        {toolList?.map((tool: any) => (
          <DropdownMenuItem key={tool.id} className="flex flex-col">
            <div className="w-full">
              <a href={tool.link} target="_blank" rel="noopener noreferrer" className='w-full flex items-center gap-2'>
                <img src={tool.icon} alt={tool.name} className="w-4 h-4" />
                <p className="font-medium">{tool.name}</p>
              </a>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppLauncher;