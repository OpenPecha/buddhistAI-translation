import { Suspense, useEffect, useEffectEvent } from "react";
import { useAuth } from "@/auth/use-auth-hook";
import Footer from "./Footbar";
import Navbar from "./Navbar";
import { Navigate } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getToken } = useAuth();

  const effect = useEffectEvent(() => {
    if (isAuthenticated) getToken();
  });

  useEffect(() => {
    effect();
  }, [effect]);

  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <Suspense fallback={<div className="flex items-center justify-center text-lg h-screen"> Loading...</div >}>
      <Navbar />
      {children}
      <Footer />
    </Suspense>
  );
}
