import { Suspense, useEffect } from "react";
import { useAuth } from "@/auth/use-auth-hook";
import Footer from "./Footbar";
import Navbar from "./Navbar";
import { Navigate } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getToken();
    }
    return () => { };
  }, []);

  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <Suspense fallback={<div className="flex items-center justify-center text-lg h-screen"> Loading...</div >}>
      <Navbar />
      {children}
      <Footer />
    </Suspense>
  );
}
