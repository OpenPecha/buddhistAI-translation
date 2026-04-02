import Quill from "quill";
import { useEffect, useRef, useState } from "react";
import Toolbar from "./Toolbar/Toolbar";
import "quill/dist/quill.snow.css";
import "quill-footnote/dist/quill-footnote.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { footnoteKeyboardBindings } from "quill-footnote";
import { createPortal } from "react-dom";
import { QuillBinding } from "y-quill";
import type * as Y from "yjs";
import { updateContentDocument } from "@/api/document";
import { useAuth } from "@/auth/use-auth-hook";
import { useEditor } from "@/hooks/useEditor";
import type { Document } from "@/hooks/useCurrentDoc";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { checkIsTibetan } from "@/lib/isTibetan";
import {
  EDITOR_ENTER_ONLY,
  MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION,
  editor_config,
} from "@/utils/editorConfig";
import { useQuillVersion } from "../contexts/VersionContext";
import LineNumberVirtualized from "./LineNumbers";
import quill_import from "./quillExtension";
import type { CustomFootnoteModule } from "./quillExtension/CustomFootnote";
import SkeletonLoader from "./SkeletonLoader";
import AnnotationList from "./Annotation/AnnotationList";
import { handleAnnotationVote } from "./quill_func";
import DocumentSidebar from "./DocumentSidebar";
import { useEditorSidebarStore } from "@/stores/editorSidebarStore";
import { useCommentStore } from "@/stores/commentStore";
import { useQuillSelection } from "@/hooks/useQuillSelection";
import {
  useSelectionStore,
  type Selection,
  type EditorId,
} from "@/stores/selectionStore";
import { useDebouncedCallback } from "@tanstack/react-pacer";
quill_import();

interface CustomRange {
  index: number;
  length: number;
  left: number;
  top: number;
  lineNumber: number | null;
}

const Editor = ({
  isTranslationEditor,
  documentId,
  isEditable,
  currentDoc,
  yText,
  provider,
  onManualSelect,
  onLineFocus,
  isContentReady = true,
}: {
  isTranslationEditor: boolean;
  documentId?: string;
  isEditable: boolean;
  currentDoc: Document;
  yText: Y.Text | undefined;
  provider: any | undefined;
  onManualSelect: (editorId: EditorId, selection: Selection) => void;
  onLineFocus: (lineNumber: number, editorId: EditorId) => void;
  isContentReady?: boolean;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarId =
    "toolbar-container" + "-" + Math.random().toString(36).slice(2, 6);
  const counterId =
    "counter-container" + "-" + Math.random().toString(36).slice(2, 6);
  const [currentRange, setCurrentRange] = useState<CustomRange | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const { registerQuillVersion, transitionPhase } = useQuillVersion();
  const [isTibetan, setIsTibetan] = useState(false);
  const {
    registerQuill,
    unregisterQuill,
    getLineNumber,
    quillEditors,
    getElementWithLinenumber,
    setSelectedText,
    setSelectedTextTag,
  } = useEditor();
  const quillRef = useRef<Quill | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const hasContentLoadedRef = useRef<boolean>(false);
  const quillEditorsRef = useRef(quillEditors);
  const getElementWithLinenumberRef = useRef(getElementWithLinenumber);
  // Keep refs up to date
  useEffect(() => {
    quillEditorsRef.current = quillEditors;
    getElementWithLinenumberRef.current = getElementWithLinenumber;
  }, [quillEditors, getElementWithLinenumber]);
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { setSidebarView, setActiveThreadId } = useCommentStore();
  const selection = useSelectionStore((state) => state.selections[documentId!]);
  const { setTabs } = useEditorSidebarStore();
  useEffect(() => {
    if (selection && quillRef.current) {
      const bounds = quillRef.current?.getBounds(
        selection.range.index,
        selection.range.length
      );
      setCurrentRange({
        index: selection.range.index,
        length: selection.range.length,
        left: bounds?.left || 0,
        top: bounds?.top || 0,
        lineNumber: selection.startLine,
      });

      // Sync selected_text_segment class to this editor at the same line number
      if (selection.startLine) {
        // Remove selected_text_segment class from all paragraphs in this editor
        const allParagraphs = quillRef.current.root.querySelectorAll("p");
        allParagraphs.forEach((p) => {
          p.classList.remove("selected_text_segment");
        });
        // Find and add class to the element at the same line number
        const elementAtLine = getElementWithLinenumberRef.current(
          quillRef.current,
          selection.startLine
        );
        if (elementAtLine && elementAtLine.tagName.toLowerCase() === "p") {
          elementAtLine.classList.add("selected_text_segment");
        }
      }
    } else {
      setCurrentRange(null);
      // Clear selected_text_segment class when selection is cleared
      if (quillRef.current) {
        const allParagraphs = quillRef.current.root.querySelectorAll("p");
        allParagraphs.forEach((p) => {
          p.classList.remove("selected_text_segment");
        });
      }
    }
  }, [selection]);

  useQuillSelection({
    quill: quillRef.current || undefined,
    editorId: documentId!,
    onManualSelect: () => {
      if (!quillRef.current || !documentId) return;
      const range = quillRef.current.getSelection();
      if (!range) return;
      const lineNumber = getLineNumber(quillRef.current);

      const text = quillRef.current.getText(range.index, range.length);
      onManualSelect(documentId!, {
        startLine: lineNumber,
        range: {
          index: range.index,
          length: range.length,
        },
        text,
      });
    },
    onLineFocus: () => {
      if (!quillRef.current) return;

      const lineNumber = getLineNumber(quillRef.current);
      if (lineNumber === null) return;

      onLineFocus(lineNumber, documentId!);
    },
  });

  // Get display settings
  const { showLineNumbers } = useDisplaySettings();
  useEffect(() => {
    if (!yText || !provider) return () => { };
    const name = currentUser?.name || "Anonymous User";
    // Generate a random dark color (R, G, and B <= 100)
    function getRandomDarkColor() {
      const r = Math.floor(Math.random() * 100);
      const g = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    const color = getRandomDarkColor();
    provider.awareness.setLocalStateField("user", {
      name,
      color,
    });
  }, [currentUser?.name]);
  // Track document opening

  const updateDocumentMutation = useMutation({
    mutationFn: (content: Record<string, unknown>) =>
      updateContentDocument(documentId as string, {
        content: content.ops as any,
      }),
    onError: (error) => {
      console.error("Error updating document content:", error);
    },
    onSuccess: () => {
      // refetch versions
      queryClient.invalidateQueries({ queryKey: [`versions-${documentId}`] });
    },
  });
  const isSaving = updateDocumentMutation.isPending;
  const queryClient = useQueryClient();
  const debouncedSave = useDebouncedCallback(
    (content: Record<string, unknown>) => {
      if (!documentId || !hasContentLoadedRef.current) return;
      // Extra safety: Don't save if content is empty or nearly empty
      const contentOps = content?.ops as any[];
      if (!contentOps || contentOps.length === 0) return;
      updateDocumentMutation.mutate(content);
    },
    { wait: 4000 }
  );

  useEffect(() => {
    const signal = new AbortController();
    const editorId = documentId;
    let binding: QuillBinding;
    const tool = document.getElementById(toolbarId);
    if (!editorRef.current || !tool) return;

    // Initialize the Yjs document and text with awareness
    const quill = new Quill(editorRef.current as HTMLDivElement, {
      theme: "snow",
      modules: {
        history: editor_config.HISTORY_CONFIG,
        cursors: editor_config.ENABLE_CURSORS,
        toolbar: {
          container: `#${toolbarId}`,
          handlers: {
            bold: () => handleFormatChange("bold"),
            italic: () => handleFormatChange("italic"),
            underline: () => handleFormatChange("underline"),
            background: (value: string) => {
              const range = quill.getSelection();
              if (range) {
                quill.format("background", value, "user");
              }
            },
            headerN: (value: string | number | null) => {
              if (value === null) {
                quill.format("headerN", false, "user");
              } else {
                quill.format("headerN", value, "user");
              }
            },
            redo: () => {
              quill.history.redo();
            },
            undo: () => {
              quill.history.undo();
            },
            footnote: () => {
              const quill = quillRef.current;
              if (!quill) return;
              const module = quill.getModule("footnote") as any;
              module.addFootnote("");
            },
          },
        },
        footnote: true,
        keyboard: {
          bindings: {
            ...footnoteKeyboardBindings,
            footnoteEsc: {
              key: "Escape",
              format: ["footnote-row"],
              handler: function (this: { quill: Quill }, range: any): boolean {
                const [line] = this.quill.getLine(range.index);
                if (line?.statics?.blotName === "footnote-row") {
                  const footnoteModule = this.quill.getModule(
                    "footnote"
                  ) as CustomFootnoteModule;

                  // delete the whole footnote row (pass the blot)
                  footnoteModule.deleteFootnote(line);

                  return false; // prevent default Escape behavior
                }

                return true;
              },
            },
          },
        },
        counter: {
          container: `#${counterId}`,
          unit: "character",
        },
      },
      readOnly: !isTranslationEditor && !isEditable,
      placeholder: t("editor.startTyping") as string,
    });

    quillRef.current = quill;
    registerQuillVersion(quill);
    registerQuill(editorId as string, quill);
    isInitializedRef.current = true;
    if (yText && provider) {
      binding = new QuillBinding(yText, quill, provider.awareness);
      provider.on("sync", (data: boolean) => {
        setIsSynced(data);
        // Mark content as loaded after sync
        if (data) {
          hasContentLoadedRef.current = true;
        }
      });
    }

    quill?.root.addEventListener(
      "keydown",
      (e: KeyboardEvent) => {
        if (EDITOR_ENTER_ONLY) {
          if (e.key !== "Enter") {
            e.preventDefault();
            e.stopPropagation();
          }
        }
        if (
          e.key === "space" ||
          e.key === "Enter" ||
          e.key === "Delete" ||
          e.key === "Backspace"
        ) {
          const footnotesInEditor =
            quill.root.querySelectorAll(".footnote-number");
          const footnoteIdsInEditor = Array.from(footnotesInEditor).map(
            (footnote) => footnote.id.split("-")[1]
          );
          const footnotesInFootnoteSection =
            quill.root.querySelectorAll(".footnote-row");
          // footnote that are present in footnote section and not in editor should be deleted check with there id footnote row contains id as footnote-row-[id]  and editor footnote contain footnote-id[]
          footnotesInFootnoteSection.forEach((footnote) => {
            const footnoteId = footnote.id.split("-row-")[1];
            if (!footnoteIdsInEditor.includes(footnoteId)) {
              footnote.remove();
            }
          });
        }
      },
      signal
    );

    function handleClick(e: MouseEvent) {
      if (!quillRef.current || !documentId) return;

      const target = e.target as HTMLElement;
      // Find the closest p element (in case clicking on child elements)
      const clickedP = target.closest("p");
      if (clickedP) {
        // Remove selected_text class from all p elements in this editor
        const allParagraphs = quill.root.querySelectorAll("p");
        allParagraphs.forEach((p) => {
          p.classList.remove("selected_text_segment");
        });
        // Add selected_text class to the clicked p element
        clickedP.classList.add("selected_text_segment");
        setSelectedTextTag(clickedP);

        const currentRange = quillRef.current.getSelection();

        const firstQLEditor = document.querySelector(
          ".ql-editor"
        ) as HTMLElement | null;

        if (!currentRange || currentRange.length === 0) {
          let textSelected = "";
          if (firstQLEditor && firstQLEditor.contains(clickedP)) {
            textSelected = clickedP.textContent || "";
          }
          setSelectedText(textSelected || "");
          // Get the blot for the clicked paragraph
          const blot = Quill.find(clickedP);
          if (!blot || blot === quillRef.current) return;

          // Type guard: check if it's a Blot (has length method)
          if (typeof (blot as any).length !== "function") return;

          // Get the index and length of the paragraph
          const paragraphIndex = quillRef.current.getIndex(blot as any);
          const paragraphLength = (blot as any).length();

          // Get the text content of the paragraph
          const paragraphText = quillRef.current.getText(
            paragraphIndex,
            paragraphLength
          );

          // Get line number for the paragraph
          const lineNumber = getLineNumber(quillRef.current);

          // Sync selected_text_segment class to other editors at the same line number
          if (lineNumber) {
            quillEditorsRef.current.forEach((otherQuill, otherEditorId) => {
              if (otherEditorId !== documentId && otherQuill) {
                // Remove selected_text_segment class from all paragraphs in other editor
                const otherParagraphs = otherQuill.root.querySelectorAll("p");
                otherParagraphs.forEach((p) => {
                  p.classList.remove("selected_text_segment");
                });
                // Find and add class to the element at the same line number
                const elementAtLine = getElementWithLinenumberRef.current(
                  otherQuill,
                  lineNumber
                );
                if (
                  elementAtLine &&
                  elementAtLine.tagName.toLowerCase() === "p"
                ) {
                  elementAtLine.classList.add("selected_text_segment");
                  elementAtLine.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }
            });
          }

          onManualSelect(documentId, {
            startLine: lineNumber || 1,
            range: {
              index: paragraphIndex,
              length: paragraphLength,
            },
            text: paragraphText,
          });
        } else {
          // Use the existing selection
          const lineNumber = getLineNumber(quillRef.current);
          const text = quillRef.current.getText(
            currentRange.index,
            currentRange.length
          );
          setSelectedText(text.trim() || "");

          // Sync selected_text_segment class to other editors at the same line number
          if (lineNumber) {
            quillEditorsRef.current.forEach((otherQuill, otherEditorId) => {
              if (otherEditorId !== documentId && otherQuill) {
                // Remove selected_text_segment class from all paragraphs in other editor
                const otherParagraphs = otherQuill.root.querySelectorAll("p");
                otherParagraphs.forEach((p) => {
                  p.classList.remove("selected_text_segment");
                });
                // Find and add class to the element at the same line number
                const elementAtLine = getElementWithLinenumberRef.current(
                  otherQuill,
                  lineNumber
                );
                if (
                  elementAtLine &&
                  elementAtLine.tagName.toLowerCase() === "p"
                ) {
                  elementAtLine.classList.add("selected_text_segment");
                }
              }
            });
          }

          onManualSelect(documentId, {
            startLine: lineNumber || 1,
            range: {
              index: currentRange.index,
              length: currentRange.length,
            },
            text,
          });
        }
      }
    }

    // Handle click on p elements to add/remove selected_text class
    quill?.root.addEventListener("click", handleClick as EventListener, {
      signal: signal.signal,
    });
    // Fetch comments when the editor loads
    quill.on("text-change", (_delta, _oldDelta, source) => {
      if (!isEditable) return;
      if (source === "user" && hasContentLoadedRef.current) {
        const currentContent = quill.getLength() > 1 ? quill.getContents() : "";
        // Only save if there's actual content (prevent saving empty editor)
        debouncedSave(currentContent as any);
      }
    });
    quill.on("selection-change", () => { });

    function handleFormatChange(type: string) {
      const range = quill.getSelection();
      if (range) {
        const format = quill.getFormat(range);
        quill.format(type, !format[type], "user");
      } else {
        // If no selection, create one at cursor position
        quill.focus();
        const newRange = quill.getSelection(true);
        if (newRange) {
          const format = quill.getFormat(newRange);
          quill.format(type, !format[type], "user");
        }
      }
    }

    return () => {
      // Only save on unmount if content has been loaded and editor has actual content
      // This prevents saving empty content during hot reload
      quill?.root?.removeEventListener("click", handleClick as EventListener);
      if (hasContentLoadedRef.current && quill.getLength() > 1) {
        const currentContent = quill.getContents();
        updateDocumentMutation.mutate(currentContent as any);
      }
      unregisterQuill(editorId as string);
      queryClient.removeQueries({
        queryKey: [`document-${documentId}`],
      });
      signal.abort();
      quill.disable();
      binding?.destroy?.();
      // Reset flags for next mount
      isInitializedRef.current = false;
      hasContentLoadedRef.current = false;
    };
  }, [isEditable, yText, provider]);

  //for non-realtime editor only

  useEffect(() => {
    const content = currentDoc?.currentVersion?.content.ops || [];
    if (yText || provider) return () => { };
    if (
      quillRef.current &&
      quillRef.current.getText().trim() === "" &&
      content.length > 0
    ) {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          const Delta = Quill.import("delta");
          const delta = new Delta(content);
          quillRef.current?.setContents(delta || []);

          setIsTibetan(checkIsTibetan(quillRef.current?.getText() || ""));
          // Mark content as loaded after setting initial content
          hasContentLoadedRef.current = true;
        });
      } else {
        setTimeout(() => {
          const Delta = Quill.import("delta");
          const delta = new Delta(content);
          quillRef.current?.setContents(delta || []);
          setIsTibetan(checkIsTibetan(quillRef.current?.getText() || ""));
          // Mark content as loaded after setting initial content
          hasContentLoadedRef.current = true;
        }, 0);
      }
    } else if (quillRef.current && quillRef.current.getText().trim() !== "") {
      // If editor already has content, mark it as loaded
      hasContentLoadedRef.current = true;
    }
  }, [currentDoc, yText, provider]);

  function addComment() {
    if (!selection) return;
    setTabs(documentId, "comments");
    setSidebarView(documentId, "new");
    setActiveThreadId(documentId, null);
  }

  const characterCount = quillRef.current?.getContents().length() || 0;
  if (!documentId) return null;
  return (
    <>
      {createPortal(
        <Toolbar
          addComment={addComment}
          synced={!isSaving || isSynced}
          documentId={documentId}
          toolbarId={toolbarId}
          range={currentRange}
          isEditable={isEditable}
          documentName={currentDoc?.name || undefined}
        />,
        document.getElementById("toolbar-container")!
      )}
      <div
        className={`relative w-full flex flex-1 h-full overflow-hidden ${isTranslationEditor ? "flex-row-reverse" : ""
          }`}
      >
        <DocumentSidebar
          documentId={documentId}
          isTranslationEditor={isTranslationEditor}
        />

        <div className="editor-container w-full h-full flex flex-1  relative max-w-6xl mx-auto  ">
          {showLineNumbers && (
            <LineNumberVirtualized
              editorRef={editorRef as React.RefObject<HTMLDivElement>}
              documentId={documentId}
            />
          )}
          <div className="flex flex-col flex-1 relative overflow-hidden">
            <div
              ref={editorRef}
              className={`editor-content flex-1 pb-1 w-full overflow-y-auto bg-editor-bg`}
              style={{
                fontFamily: isTibetan ? "Monlam" : "google-sans-regular",
                fontSize: isTibetan ? "1rem" : "1.3rem",
                lineHeight: 1.5,
              }}
            />

            {!isContentReady && (
              <div className="absolute inset-0 bg-white dark:bg-neutral-900 z-10 flex items-center justify-center">
                <p className="text-gray-500 dark:text-neutral-300">Loading document...</p>
              </div>
            )}
          </div>
          {createPortal(
            <div
              className="flex gap-1 items-center text-sm text-gray-500 px-2 dark:text-neutral-300 hover:text-gray-900"
              title={`${characterCount > MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION
                ? `collaboration limit exceeded , max limit is ${MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION} characters`
                : ""
                }`}
            >
              <div id={`${counterId}`} className="leading-[normal]">
                0
              </div>

              {t("editor.characters")}
            </div>,
            document.getElementById("counter")!
          )}
          <AnnotationList onVote={handleAnnotationVote} />
        </div>
      </div>
    </>
  );
};

export default Editor;
