import React, { memo, useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Globe, Eye, FileText, Moon, Sun, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/use-auth-hook";
// import { EditorProvider } from "@/contexts/EditorContext";
import { CommentProvider } from "@/contexts/CommentContext";
import { useTheme } from "@/contexts/ThemeProvider";
import { FootNoteProvider } from "@/contexts/FootNoteContext";
import { useCurrentDoc } from "@/hooks/useCurrentDoc";
import { useTranslationSidebarParams } from "@/hooks/useQueryParams";
import { createPortal } from "react-dom";
import Split from "react-split";
import isMobile from "@/lib/isMobile";

import DocumentEditor from "./DocumentEditor";
import PublicSideMenu from "./PublicSideMenu";
import { AnnotationProvider } from "@/contexts/AnnotationContext";
import { useFetchPublicDocument } from "@/api/queries/documents";

interface PublicDocumentViewerProps {
  documentId?: string;
}

const PublicDocumentEditor = memo(
  ({ docId, currentDoc }: { docId: string | undefined; currentDoc: any }) => {
    if (!currentDoc) {
      return <div>Loading...</div>;
    }
    return (
      <DocumentEditor
        liveEnabled={false}
        docId={docId}
        isEditable={false}
        currentDoc={currentDoc.data}
      />
    );
  }
);


// Translation Editor Component for Public View
const PublicTranslationEditor: React.FC<{
  selectedTranslationId: string;
}> = ({ selectedTranslationId }) => {
  const {
    data: documentData,
    isLoading,
    error,
  } = useFetchPublicDocument(selectedTranslationId);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  return (
    <div className="h-full w-full">
      <PublicDocumentEditor
        docId={selectedTranslationId}
        currentDoc={documentData}
      />
    </div>
  );
};

// Custom navbar for public view
const PublicNavbar: React.FC<{
  document: any;
  onBackToApp: () => void;
  selectedTranslationId: string | null;
}> = ({ document, onBackToApp, selectedTranslationId }) => {
  const { isAuthenticated } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { currentDoc: translationDoc } = useCurrentDoc(
    selectedTranslationId || undefined,
    true
  );

  // Show translation info if viewing a translation
  const displayDocument = selectedTranslationId ? translationDoc : document;
  const isViewingTranslation = !!selectedTranslationId;

  const toggleTheme = () => {
    const isDark = resolvedTheme === "dark";
    setTheme(isDark ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";

  return (
    <div className="bg-white dark:bg-neutral-900 border-b mb-3">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-secondary-600 dark:text-neutral-300" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-neutral-300">
                {displayDocument?.name || "Document"}
                {isViewingTranslation && (
                  <span className="text-sm font-normal text-gray-500 dark:text-neutral-300 ml-2">
                    (Translation)
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1 text-secondary-600 dark:text-neutral-300" />
                  Public Document
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1 text-secondary-600 dark:text-neutral-300" />
                  Read-Only
                </Badge>
                {displayDocument?.language && (
                  <Badge variant="outline" className="text-xs">
                    {displayDocument.language.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-secondary-600 dark:text-neutral-300" />
              ) : (
                <Moon className="h-4 w-4 text-secondary-600 dark:text-neutral-300" />
              )}
            </Button>
            <Button onClick={onBackToApp} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2 text-secondary-600 dark:text-neutral-300" />
              <span className="hidden md:block">
                {isAuthenticated ? "Back to Dashboard" : "Sign In to Collaborate"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};






const PublicDocumentViewer: React.FC<PublicDocumentViewerProps> = ({
  documentId: propDocumentId,
}) => {
  const { id: paramDocumentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const documentId = propDocumentId || paramDocumentId;
  const [splitPosition, setSplitPosition] = useState<number>(40);

  // Use URL parameters for selected translation
  const {
    selectedTranslationId,
    setSelectedTranslationId,
    clearSelectedTranslationId,
  } = useTranslationSidebarParams();

  // Handle translation selection
  const handleSelectTranslation = useCallback(
    (translationId: string | null) => {
      setSelectedTranslationId(translationId);
    },
    [setSelectedTranslationId]
  );

  // Fetch public document
  const {
    data: documentData,
    isLoading,
    error,
  } = useFetchPublicDocument(documentId!);

  const handleBackToApp = useCallback(() => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Create portal containers exactly like in the main app
  useEffect(() => {
    const ensurePortalContainer = (id: string) => {
      if (!window.document.getElementById(id)) {
        const container = window.document.createElement("div");
        container.id = id;
        window.document.body.appendChild(container);
      }
    };

    ensurePortalContainer("navbar");
    ensurePortalContainer("toolbar-container");
    ensurePortalContainer("counter");

    return () => {
      // Cleanup on unmount
      const containers = ["navbar", "toolbar-container", "counter"];
      containers.forEach((id) => {
        const element = window.document.getElementById(id);
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary-600 dark:text-neutral-300" />
              Loading Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-neutral-300 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-neutral-300">Loading document...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                This document is not publicly accessible or doesn't exist.
                Please check the link or contact the document owner.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleBackToApp}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2 text-secondary-600 dark:text-neutral-300" />
                <span className="hidden md:block">
                  {isAuthenticated ? "Back to Dashboard" : "Go to Login"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CommentProvider>
      <AnnotationProvider>
        <FootNoteProvider>
          {/* Navbar rendered in portal - exactly like DocumentWrapper */}
          {createPortal(
            <PublicNavbar
              document={documentData}
              onBackToApp={handleBackToApp}
              selectedTranslationId={selectedTranslationId}
            />,
            window.document.getElementById("navbar")!
          )}

          {/* Main editor container - exactly like DocumentWrapper */}
          <div className="grid grid-rows-[1fr] h-full">
            <div className="relative flex px-2 w-full overflow-hidden">
              {!selectedTranslationId ? (
                <>
                  <PublicDocumentEditor
                    docId={documentId}
                    currentDoc={documentData}
                  />
                  <PublicSideMenu
                    documentId={documentId!}
                    onSelectTranslation={handleSelectTranslation}
                  />
                </>
              ) : (
                <div className="relative h-full w-full group">
                  {/* Close button positioned dynamically in the middle of the gutter */}
                  <button
                    className="absolute bg-neutral-50 dark:bg-neutral-600 border-2 border-gray-300 cursor-pointer rounded-full p-2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-neutral-700 dark:text-neutral-300 text-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover/translation:opacity-100 duration-200 shadow-lg hover:shadow-xl hover:border-gray-400 transition-opacity z-10"
                    style={{ left: isMobile ? "97%" : `${splitPosition}%` }}
                    onClick={() => clearSelectedTranslationId()}
                    aria-label="Close translation view"
                    title="Close translation view"
                    type="button"
                  >
                    <ChevronRight />
                  </button>

                  <Split
                    sizes={[splitPosition, 100 - splitPosition]}
                    minSize={[300, 400]}
                    expandToMin={false}
                    gutterSize={8}
                    gutterAlign="center"
                    snapOffset={30}
                    dragInterval={1}
                    direction={isMobile ? "vertical" : "horizontal"}
                    cursor="col-resize"
                    className={`split-pane h-full flex w-full overflow-hidden ${isMobile ? "flex-col" : "flex-row"
                      }`}
                    gutterStyle={() => ({
                      backgroundColor: "#e5e7eb",
                      border: "1px solid #d1d5db",
                      cursor: "col-resize",
                      position: "relative",
                    })}
                    onDragStart={() => {
                      document.body.style.cursor = "col-resize";
                    }}
                    onDragEnd={(sizes) => {
                      document.body.style.cursor = "";
                      setSplitPosition(sizes[0]);
                    }}
                    onDrag={(sizes) => {
                      setSplitPosition(sizes[0]);
                    }}
                  >
                    {/* Root Editor */}
                    <PublicDocumentEditor
                      docId={documentId}
                      currentDoc={documentData}
                    />

                    {/* Translation Editor */}
                    <div className="group/translation h-full w-full">
                      <PublicTranslationEditor
                        selectedTranslationId={selectedTranslationId}
                      />
                    </div>
                  </Split>
                </div>
              )}
            </div>
          </div>
        </FootNoteProvider>
      </AnnotationProvider>
    </CommentProvider>
  );
};



export default PublicDocumentViewer;
