import { isEqual } from "lodash";
import type Quill from "quill";
import type React from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type TextSelectionContextType = {
  selectedText: string;
  selectedTextTag: HTMLElement | null;
  activeSelectedEditor: string | null;
  selectedTextLineNumbers: Record<string, { from: number; to: number }> | null;
  setSelectedText: (d: string) => void;
  setSelectedTextTag: (d: HTMLElement | null) => void;
  clearSelection: () => void;
  clearUISelection: () => void;
  getTranslatedTextForLine: (lineNumber: number) => string | null;
  getOriginalTextForLine: (lineNumber: number) => string | null;
  getTextPairsByLineNumbers: () => Array<{
    original_text: string;
    translated_text: string;
  }> | null;
};

type EditorContextType = {
  activeEditor: string | null;
  setActiveEditor: (id: string) => void;
  activeQuill: Quill | null;
  setActiveQuill: (quill: Quill | null) => void;
  quillEditors: Map<string, Quill>;
  registerQuill: (id: string, quill: Quill) => void;
  unregisterQuill: (id: string) => void;
  getQuill: (id: string) => Quill | null;
  getLineNumber: (quill: Quill | null) => number | null;
  getElementWithLinenumber: (
    quill: Quill | null,
    line_number: number
  ) => HTMLElement | null;
  getTextByLineNumber: (
    quill: Quill | null,
    lineNumber: number
  ) => string | null;
  getSelectionLineNumbers: () => Record<
    string,
    { from: number; to: number }
  > | null;
  scrollToLineNumber: (line_number: number, quill?: Quill | null) => boolean;
  hoveredLineNumber: number | null;
  setHoveredLineNumber: (lineNumber: number | null) => void;
} & TextSelectionContextType;

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [activeQuill, setActiveQuill] = useState<Quill | null>(null);
  const [quillEditors, setQuillEditors] = useState<Map<string, Quill>>(
    new Map()
  );

  const [hoveredLineNumber, setHoveredLineNumber] = useState<number | null>(
    null
  );

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedTextTag, setSelectedTextTag] = useState<HTMLElement | null>(
    null
  );
  const [activeSelectedEditor, setActiveSelectedEditor] = useState<
    string | null
  >(null);
  const [selectedTextLineNumbers, setSelectedTextLineNumbers] = useState<Record<
    string,
    { from: number; to: number }
  > | null>(null);

  // Function to get selected text from the DOM (only from main editor)
  const getSelectedText = useCallback(() => {
    // Find the first instance of .ql-editor in the DOM
    const EditorElement = document.querySelector(
      ".ql-editor"
    ) as HTMLElement | null;
    const selection = globalThis.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      EditorElement &&
      selection.toString().trim()
    ) {
      const range = selection.getRangeAt(0);

      // Only allow selection if both endpoints are inside the EditorElement
      if (
        EditorElement.contains(range.startContainer) &&
        EditorElement.contains(range.endContainer)
      ) {
        return selection.toString().trim();
      }
    }
    return "";
  }, []);

  // Monitor text selection changes
  useEffect(() => {
    const handleSelectionChange = (event: Event) => {
      const editorElements = document.querySelectorAll(
        ".ql-editor"
      ) as HTMLElement;
      const editorElement = editorElements[0];
      const isActiveSourceEditor =
        editorElement === event.srcElement?.activeElement;

      if (!isActiveSourceEditor) return;
      const text = getSelectedText();
      const lineNumbers = getSelectionLineNumbers();
      // Update state only if text or line numbers have actually changed
      setSelectedText((prevText) => {
        if (text !== prevText) {
          return text;
        }
        return prevText;
      });

      setSelectedTextLineNumbers((prevLineNumbers) => {
        if (!isEqual(lineNumbers, prevLineNumbers)) {
          return lineNumbers;
        }
        return prevLineNumbers;
      });

      if (text) {
        setActiveSelectedEditor(activeEditor);
      } else {
        setActiveSelectedEditor(null);
      }
    };

    // Add event listener for selection changes
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [selectedText, activeEditor, getSelectedText]);

  const clearSelection = () => {
    setSelectedText("");
    setActiveSelectedEditor(null);
    setSelectedTextLineNumbers(null);
  };

  const clearUISelection = () => {
    // Clear only the visual selection, keep line numbers for replace functionality
    setSelectedText("");
    setActiveSelectedEditor(null);
    // Keep selectedTextLineNumbers intact
  };

  const getTranslatedTextForLine = (lineNumber: number): string | null => {
    if (!activeEditor || quillEditors.size < 2) {
      return null;
    }

    let otherEditorId: string | null = null;
    for (const editorId of quillEditors.keys()) {
      if (editorId !== activeEditor) {
        otherEditorId = editorId;
        break;
      }
    }

    if (!otherEditorId) {
      return null;
    }

    const otherEditorQuill = getQuill(otherEditorId);
    return getTextByLineNumber(otherEditorQuill, lineNumber);
  };

  const getOriginalTextForLine = (lineNumber: number): string | null => {
    if (!activeEditor) {
      return null;
    }
    const quill = getQuill(activeEditor);
    return getTextByLineNumber(quill, lineNumber);
  };

  const getTextPairsByLineNumbers = (): Array<{
    original_text: string;
    translated_text: string;
  }> | null => {
    if (!selectedTextLineNumbers) {
      return null;
    }
    const lineNumbers = Object.keys(selectedTextLineNumbers).map(Number);
    const textPairs = [];
    for (const lineNumber of lineNumbers) {
      const originalText = getOriginalTextForLine(lineNumber);
      const translatedText = getTranslatedTextForLine(lineNumber);
      if (originalText && translatedText) {
        textPairs.push({
          original_text: originalText,
          translated_text: translatedText,
        });
      }
    }
    return textPairs;
  };

  const registerQuill = useCallback(
    (id: string, quill: Quill) => {
      setQuillEditors((prev) => {
        const next = new Map(prev);
        next.set(id, quill);
        // Set the first editor as active if no editor is currently active
        if (prev.size === 0) {
          setActiveEditor(id);
          setActiveQuill(quill);
        }
        return next;
      });

      quill.on("selection-change", (range) => {
        if (activeEditor !== id && range) {
          setActiveEditor(id);
          setActiveQuill(quill);
        }
      });
    },
    [activeEditor, activeQuill]
  );
  const unregisterQuill = useCallback((id: string) => {
    if (!id) return;
    setQuillEditors((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });

    if (activeEditor === id) {
      setActiveEditor(null);
      setActiveQuill(null);
    }
    if (quillEditors.size > 0) {
      setActiveEditor(Array.from(quillEditors.keys())[0]);
    }
  }, []);

  const getQuill = useCallback(
    (id: string): Quill | null => {
      return quillEditors.get(id) ?? null;
    },
    [quillEditors]
  );

  const getLineNumber = (quill: Quill | null) => {
    if (!quill) return null;

    const range = quill.getSelection();
    if (!range) return null;

    const editorDiv = quill.root;
    const editorElement = editorDiv;
    if (!editorElement) return null;

    // Get the selection's position
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const domRange = selection.getRangeAt(0);
    const clickedElement = domRange.startContainer.parentElement;
    // Check if the clicked element is empty or is a div
    if (
      clickedElement &&
      (!clickedElement.textContent?.trim() ||
        clickedElement.tagName.toLowerCase() === "div")
    ) {
      return null;
    }

    const rect = domRange.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const editorScrollTop = editorElement.scrollTop;

    // Calculate the relative position in the editor
    const relativePosition = rect.top - editorRect.top + editorScrollTop;

    const sourceContainer = editorDiv.closest(".editor-container");
    const sourceLineNumbersContainer =
      sourceContainer?.querySelector(".line-numbers");
    if (!sourceLineNumbersContainer) return null;

    // Find the line number element that is closest to the selection's position
    const lineNumberElements = Array.from(
      sourceLineNumbersContainer.querySelectorAll(".line-number")
    );

    let closestLineElement: HTMLElement | null = null;
    let minDistance = Number.MAX_VALUE;

    for (const lineEl of lineNumberElements) {
      const lineTop = parseFloat((lineEl as HTMLElement).style.top);
      const distance = Math.abs(lineTop - relativePosition);

      if (distance < minDistance) {
        minDistance = distance;
        closestLineElement = lineEl as HTMLElement;
      }
    }

    if (!closestLineElement) return null;

    const spanElement = closestLineElement.querySelector("span");
    return spanElement ? parseInt(spanElement.textContent || "0") : null;
  };

  const getElementWithLinenumber = (
    quill: Quill | null,
    line_number: number
  ): HTMLElement | null => {
    if (!quill) return null;

    const editorDiv = quill.root;
    const editorElement = editorDiv;
    if (!editorElement) return null;

    const sourceContainer = editorDiv.closest(".editor-container");
    const sourceLineNumbersContainer =
      sourceContainer?.querySelector(".line-numbers");
    if (!sourceLineNumbersContainer) return null;

    // Find the line number element with the specified number in the other editor
    const lineNumberElement = sourceLineNumbersContainer.querySelector(
      `.line-number[id$="-line-${line_number}"]`
    );
    if (!lineNumberElement) return null;

    // Get the top position of the line number
    const lineTop = parseFloat((lineNumberElement as HTMLElement).style.top);
    const editorRect = editorElement.getBoundingClientRect();
    const editorScrollTop = editorElement.scrollTop;

    // Calculate the absolute position in the editor
    const absolutePosition = lineTop + editorRect.top - editorScrollTop;

    // Find the element at this position in the other editor
    const elements = Array.from(
      editorElement.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div")
    );
    const elementAtPosition = elements.find((el) => {
      const rect = el.getBoundingClientRect();
      return Math.abs(rect.top - absolutePosition) < 5; // 5px tolerance
    });

    return elementAtPosition as HTMLElement | null;
  };

  const getTextByLineNumber = (
    quill: Quill | null,
    lineNumber: number
  ): string | null => {
    if (!quill || lineNumber < 1) return null;

    const fullText = quill.getText();
    const fullTextLines = fullText.split("\n");

    let currentLineNumber = 1;

    for (let i = 0; i < fullTextLines.length; i++) {
      const lineText = fullTextLines[i];

      // Skip counting for leading/trailing empty lines
      if (!lineText.trim()) continue;

      if (currentLineNumber === lineNumber) {
        // Count number of consecutive empty lines *after* this line
        let noOfNewLines = 0;
        for (let j = i + 1; j < fullTextLines.length; j++) {
          if (fullTextLines[j].trim()) break;
          noOfNewLines++;
        }

        return lineText + "\n".repeat(noOfNewLines);
      }

      currentLineNumber++;
    }

    return null; // Line number not found
  };

  const getSelectionLineNumbers = useCallback((): Record<
    string,
    { from: number; to: number }
  > | null => {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    if (!range) return null;

    // Find which editor this selection belongs to
    let targetQuill: Quill | null = null;
    let editorContainer: Element | null = null;

    // Handle both DOM Range and Quill Range
    let container: Node | null = null;
    if (range instanceof Range) {
      container = range.commonAncestorContainer;
    } else {
      // It's a Quill range object { index, length }
      // We need to find the container from the Quill instance
      if (activeQuill) {
        targetQuill = activeQuill;
        editorContainer = activeQuill.root.closest(".editor-container");
      }
    }

    if (!targetQuill && container) {
      let element =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element);

      while (element) {
        if (element.classList?.contains("ql-editor")) {
          editorContainer = element.closest(".editor-container");
          break;
        }
        element = element.parentElement;
      }

      if (!editorContainer) return null;

      // Find the corresponding Quill instance
      for (const [, quill] of quillEditors) {
        if (quill.root.closest(".editor-container") === editorContainer) {
          targetQuill = quill;
          break;
        }
      }
    }

    if (!targetQuill) return null;

    const quillRange = targetQuill.getSelection();
    if (!quillRange) return null;

    const result: Record<string, { from: number; to: number }> = {};

    // Get the full text of the editor to work with line positions
    const fullText = targetQuill.getText();
    const fullTextLines = fullText.split("\n");

    // Calculate which part of each line is selected
    const selectionStart = quillRange.index;
    const selectionEnd = quillRange.index + quillRange.length;

    let currentIndex = 0;
    let currentLineNumber = 1;

    for (let lineIndex = 0; lineIndex < fullTextLines.length; lineIndex++) {
      const lineText = fullTextLines[lineIndex];
      const lineStart = currentIndex;
      const lineEnd = currentIndex + lineText.length;

      // Skip empty lines (similar to getLineNumber logic)
      if (!lineText.trim()) {
        currentIndex = lineEnd + 1; // +1 for the newline character
        continue; // Don't increment currentLineNumber for empty lines
      }

      // Check if this line intersects with our selection
      if (lineStart < selectionEnd && lineEnd >= selectionStart) {
        // Calculate the intersection
        const selectionStartInLine = Math.max(0, selectionStart - lineStart);
        const selectionEndInLine = Math.min(
          lineText.length,
          selectionEnd - lineStart
        );

        if (selectionStartInLine < selectionEndInLine) {
          result[currentLineNumber.toString()] = {
            from: selectionStartInLine,
            to: selectionEndInLine,
          };
        } else if (
          quillRange.length === 0 &&
          lineStart <= selectionStart &&
          selectionStart <= lineEnd
        ) {
          // Handle cursor position (no selection) - return the entire line
          result[currentLineNumber.toString()] = {
            from: 0,
            to: lineText.length,
          };
        }
      }

      currentIndex = lineEnd + 1; // +1 for the newline character
      currentLineNumber++;

      // Break if we've passed the selection
      if (currentIndex > selectionEnd) break;
    }

    return Object.keys(result).length > 0 ? result : null;
  }, [activeQuill, quillEditors]);

  const scrollToLineNumber = useCallback(
    (line_number: number, quill?: Quill | null): boolean => {
      // If specific quill provided, only scroll that one
      if (quill) {
        return scrollSingleEditor(quill, line_number);
      }

      // Otherwise scroll all editors
      let success = false;
      quillEditors.forEach((editor) => {
        if (scrollSingleEditor(editor, line_number)) {
          success = true;
        }
      });
      return success;
    },
    [quillEditors]
  );

  // Helper function to scroll a single editor
  const scrollSingleEditor = (quill: Quill, line_number: number): boolean => {
    const editorElement = quill.root;
    const editorContainer = editorElement.closest(".editor-container");
    if (!editorContainer) return false;

    const lineNumbersContainer = editorContainer.querySelector(".line-numbers");
    if (!lineNumbersContainer) return false;

    // Find the line number element for the target line
    const targetLineElement = lineNumbersContainer.querySelector(
      `.line-number[id$="-line-${line_number}"]`
    ) as HTMLElement;

    if (!targetLineElement) return false;

    // Get the top position of the line and scroll to it
    const lineTop = parseFloat(targetLineElement.style.top);
    editorElement.scrollTo({
      top: lineTop - 50, // Add small offset for better visibility
      behavior: "smooth",
    });

    // Add visual feedback - highlight and blink the line number
    highlightLineNumberInternal(targetLineElement);

    return true;
  };

  // Helper function to add visual feedback to the line number
  const highlightLineNumberInternal = (lineElement: HTMLElement) => {
    const spanElement = lineElement.querySelector("span");
    if (!spanElement) {
      console.error(
        `❌ No span element found in line element for highlighting`
      );
      return;
    }

    // Remove any existing highlight classes
    spanElement.classList.remove("line-highlight", "line-blink");

    // Store original styles
    const originalBackgroundColor = spanElement.style.backgroundColor;
    const originalColor = spanElement.style.color;
    const originalTransition = spanElement.style.transition;

    // Apply initial highlight
    spanElement.style.transition = "all 0.2s ease-in-out";
    spanElement.style.backgroundColor = "#3b82f6"; // Blue background
    spanElement.style.color = "#ffffff"; // White text
    spanElement.style.transform = "scale(1.1)";
    spanElement.style.borderRadius = "4px";
    spanElement.style.padding = "2px 4px";
    spanElement.style.fontWeight = "bold";

    // Create blinking effect
    let blinkCount = 0;
    const maxBlinks = 3;
    const blinkInterval = setInterval(() => {
      if (blinkCount >= maxBlinks) {
        clearInterval(blinkInterval);
        // Fade back to original state
        spanElement.style.transition = "all 0.3s ease-out";
        spanElement.style.backgroundColor = originalBackgroundColor;
        spanElement.style.color = originalColor;
        spanElement.style.transform = "scale(1)";
        spanElement.style.borderRadius = "";
        spanElement.style.padding = "";
        spanElement.style.fontWeight = "";

        // Clean up after animation
        setTimeout(() => {
          spanElement.style.transition = originalTransition;
        }, 300);
        return;
      }

      // Toggle between highlight and slightly dimmed
      if (blinkCount % 2 === 0) {
        spanElement.style.backgroundColor = "#1d4ed8"; // Darker secondary
        spanElement.style.transform = "scale(1.05)";
      } else {
        spanElement.style.backgroundColor = "#3b82f6"; // Original secondary
        spanElement.style.transform = "scale(1.1)";
      }
      blinkCount++;
    }, 200);
  };

  const value = useMemo(
    () => ({
      activeEditor,
      setActiveEditor,
      activeQuill,
      setActiveQuill,
      quillEditors,
      registerQuill,
      unregisterQuill,
      getQuill,
      getLineNumber,
      getElementWithLinenumber,
      getTextByLineNumber,
      getSelectionLineNumbers,
      scrollToLineNumber,
      hoveredLineNumber,
      setHoveredLineNumber,

      // selection context
      selectedText,
      activeSelectedEditor,
      setSelectedTextTag,
      selectedTextTag,
      selectedTextLineNumbers,
      setSelectedText: (d: string) => {
        if (d === "") return;
        setSelectedText(d);
      },
      clearSelection,
      clearUISelection,
      getTranslatedTextForLine,
      getOriginalTextForLine,
      getTextPairsByLineNumbers,
    }),
    [
      activeEditor,
      activeQuill,
      quillEditors,
      registerQuill,
      unregisterQuill,
      getQuill,
      getLineNumber,
      getElementWithLinenumber,
      getTextByLineNumber,
      getSelectionLineNumbers,
      scrollToLineNumber,
      hoveredLineNumber,
      selectedText,
      activeSelectedEditor,
      setSelectedTextTag,
      selectedTextTag,
      selectedTextLineNumbers,
      setSelectedText,
      clearSelection,
      clearUISelection,
      getTranslatedTextForLine,
      getOriginalTextForLine,
      getTextPairsByLineNumbers,
    ]
  );
  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
};

const EditorContext = createContext<EditorContextType>({
  activeEditor: null,
  setActiveEditor: () => { },
  activeQuill: null,
  setActiveQuill: () => { },
  quillEditors: new Map(),
  registerQuill: () => { },
  unregisterQuill: () => { },
  getQuill: () => null,
  getLineNumber: () => null,
  getElementWithLinenumber: () => null,
  getTextByLineNumber: () => null,
  getSelectionLineNumbers: () => ({}),
  scrollToLineNumber: () => false,
  hoveredLineNumber: null,
  setHoveredLineNumber: () => { },
  selectedText: "",
  activeSelectedEditor: null,
  setSelectedTextTag: () => { },
  selectedTextTag: null,
  selectedTextLineNumbers: null,
  setSelectedText: () => { },
  clearSelection: () => { },
  clearUISelection: () => { },
  getTranslatedTextForLine: () => null,
  getOriginalTextForLine: () => null,
  getTextPairsByLineNumbers: () => null,
});

export default EditorContext;
