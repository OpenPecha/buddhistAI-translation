import React from "react";
import AvatarWrapper from "./ui/custom-avatar";
import { useAuth } from "@/auth/use-auth-hook";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { IoIosLogOut } from "react-icons/io";

function ProfileArea() {
  const { currentUser, logout } = useAuth();

  function handleLogout(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center font-sans rounded-md transition"
        >
          <AvatarWrapper
            imageUrl={currentUser?.picture}
            name={currentUser?.name}
            size={36}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{currentUser?.name}</span>
          <span className="text-xs text-neutral-500">{currentUser?.email}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <button
            className="flex w-full items-center gap-2"
            onClick={handleLogout}
          >
            <IoIosLogOut className="h-4 w-4" />
            Logout
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileArea;
