import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import DocumentsWrapper from "./components/DocumentWrapper";
import PublicDocumentViewer from "./components/PublicDocumentViewer";
import { UserbackProvider } from "./contexts/UserbackProvider";
import Documentation from "./documentation/Documentation";
import Callback from "./pages/Callback";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import { Layout } from "./pages/layout";
import { AuthProvider } from "./auth/AuthProvider";
import { TooltipProvider } from "./components/ui/tooltip";
import "./i18n";
import { useTranslation } from "react-i18next";
import { EditorProvider } from "@/contexts/EditorContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Home from "./pages/Home/Home";
const ProjectList = lazy(() => import("./components/Dashboard/ProjectList"));
const QuillVersionProvider = lazy(() =>
  import("./contexts/VersionContext").then((module) => ({
    default: module.QuillVersionProvider,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60, // 1 hour
    },
  },
});
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__?: import("@tanstack/query-core").QueryClient;
  }
}

// Only expose in development
if (import.meta.env.MODE === "development") {
  (window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;
}
function AppContent() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  return (
    <div
      className={`flex flex-col h-full ${currentLanguage === "bo" && "font-monlam-2 !text-md"
        }`}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <ProjectList />
            </Layout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/callback" element={<Callback />} />

        <Route
          path="/documents/public/:id"
          element={
            <Suspense fallback={<div className="flex items-center justify-center text-lg h-screen">Loading...</div>}>
              <PublicDocumentViewer />
            </Suspense>
          }
        />

        <Route
          path="/documents/:id"
          element={
            <Suspense fallback={<div className="flex items-center justify-center text-lg h-screen">Loading...</div>}>
              <EditorProvider>
                <QuillVersionProvider>
                  <DocumentsWrapper />
                </QuillVersionProvider>
              </EditorProvider>
            </Suspense>
          }
        />
        <Route path="/help" element={<Documentation />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserbackProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </UserbackProvider>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
