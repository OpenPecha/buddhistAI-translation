import React from "react";
import { useAuth } from "@/auth/use-auth-hook";
import { Button } from "@/components/ui/button";
import { IoIosLogOut } from "react-icons/io";

const AuthLogout = () => {
    const { logout } = useAuth();
    function handleLogout(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        logout();
    }
    return (
        <Button size="icon" onClick={handleLogout} variant="outline">
            <IoIosLogOut className="w-4 h-4" />
        </Button>
    );
};

export default AuthLogout;
