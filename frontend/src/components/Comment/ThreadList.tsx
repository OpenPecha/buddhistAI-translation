import { useCommentStore } from "@/stores/commentStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditor } from "@/hooks/useEditor";
import { useSelectionStore } from "@/stores/selectionStore";
import React, { useState, useEffect, useMemo, useRef } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Thread } from "@/api/thread";
import { useFetchThreads } from "./hooks/useFetchThreads";
import { useDeleteThread } from "./hooks/useDeleteThread";
import { Trash2, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";

// Loading skeleton components
const ThreadLoadingSkeleton = () => (
  <div className="space-y-2 p-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="animate-pulse border border-neutral-200 dark:border-zinc-700 rounded-lg p-3 space-y-2"
      >
        <div className="flex items-center gap-2">
          <div className="h-4 bg-neutral-200 dark:bg-zinc-700 rounded flex-1" />
        </div>
        <div className="h-3 bg-neutral-100 dark:bg-zinc-700 rounded w-2/3" />
      </div>
    ))}
  </div>
);

// Error components
const ErrorState = ({
  message,
  onRetry,
  icon: Icon = AlertCircle,
}: {
  message: string;
  onRetry: () => void;
  icon?: React.ElementType;
}) => (
  <div className="p-4 m-2 border border-red-200 bg-red-50 rounded-lg">
    <div className="flex items-start gap-3">
      <Icon size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-red-800">{message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-red-600 border-red-300 hover:bg-red-100"
        >
          <RefreshCw size={14} className="mr-1" />
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

const ThreadList = ({ documentId }: { documentId: string }) => {
  const {
    setSidebarView,
    setActiveThreadId,
    getActiveThreadId,
    getSidebarView,
  } = useCommentStore();

  const deleteThreadMutation = useDeleteThread();
  const [threadPendingDelete, setThreadPendingDelete] = useState<Thread | null>(
    null
  );
  const isDeletingThread = deleteThreadMutation.isPending;

  const { getQuill } = useEditor();
  const quill = getQuill(documentId);

  const selection = useSelectionStore((state) => state.selections[documentId]);
  const debouncedSelection = useDebounce(selection, 300);

  const activeThreadId = getActiveThreadId(documentId);
  const sidebarView = getSidebarView(documentId);
  const previousSelectionRef = useRef<string | null>(null);

  // Fetch all threads by default
  const {
    data: allThreads = [],
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useFetchThreads({
    documentId,
    startOffset: undefined,
    endOffset: undefined,
  });

  // Fetch threads for selected segment to find matching thread
  const { data: threadsInSelection = [] } = useFetchThreads({
    documentId,
    startOffset: debouncedSelection?.range?.index,
    endOffset:
      debouncedSelection?.range?.index !== undefined &&
        debouncedSelection?.range?.length !== undefined
        ? debouncedSelection.range.index + debouncedSelection.range.length
        : undefined,
  });

  // Find the thread that matches the current selection
  const matchingThread = useMemo(() => {
    if (!debouncedSelection?.range || threadsInSelection.length === 0) {
      return null;
    }
    const { index, length } = debouncedSelection.range;
    const endOffset = index + length;

    // Find thread that overlaps with the selection
    return (
      threadsInSelection.find((thread: Thread) => {
        const threadStart = thread.initialStartOffset;
        const threadEnd = thread.initialEndOffset;
        return (
          (index >= threadStart && index <= threadEnd) ||
          (endOffset >= threadStart && endOffset <= threadEnd) ||
          (index <= threadStart && endOffset >= threadEnd)
        );
      }) || null
    );
  }, [debouncedSelection, threadsInSelection]);

  // Auto-select thread when text is selected and a matching thread is found
  useEffect(() => {
    const currentSelectionKey = debouncedSelection?.range
      ? `${debouncedSelection.range.index}-${debouncedSelection.range.length}`
      : null;

    if (
      matchingThread &&
      matchingThread.id !== activeThreadId &&
      sidebarView === "list" &&
      currentSelectionKey !== previousSelectionRef.current &&
      currentSelectionKey !== null
    ) {
      setSidebarView(documentId, "thread");
      setActiveThreadId(documentId, matchingThread.id);
    }

    previousSelectionRef.current = currentSelectionKey;
  }, [
    matchingThread,
    activeThreadId,
    sidebarView,
    debouncedSelection,
    documentId,
    setSidebarView,
    setActiveThreadId,
  ]);

  const handleThreadClick = (threadId: string) => {
    setSidebarView(documentId, "thread");
    setActiveThreadId(documentId, threadId);

    const editor = quill?.root;
    const targetElement = editor?.querySelector(
      `[data-thread-id="${threadId}"]`
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        targetElement.classList.add("animate-pulse");
        setTimeout(() => {
          targetElement.classList.remove("animate-pulse");
        }, 3000);
      }, 100);
    }
  };

  const handleConfirmDelete = () => {
    if (!threadPendingDelete || isDeletingThread) return;

    deleteThreadMutation.mutate(threadPendingDelete, {
      onSuccess: () => setThreadPendingDelete(null),
    });
  };

  const hasNoData = allThreads.length === 0;
  const isLoading = threadsLoading;
  const hasError = threadsError;

  if (hasNoData && !isLoading && !hasError) {
    return (
      <div className="p-6 text-center h-full flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="rounded-full w-fit bg-neutral-100 dark:bg-zinc-800 p-3">
            <MessageSquare size={24} className="text-neutral-400" />
          </div>
          <p className="font-medium text-neutral-700 dark:text-neutral-300">No comments</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Select text to see related comments
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-y-1 p-2 pb-10">
        {threadsLoading && <ThreadLoadingSkeleton />}

        {threadsError && (
          <ErrorState
            message="Failed to load comments. Please try again."
            onRetry={() => refetchThreads()}
            icon={MessageSquare}
          />
        )}

        {allThreads.length > 0 ? (
          <>
            <div className="px-2 py-1 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Comments ({allThreads.length})
            </div>

            {allThreads.map((thread: Thread) => {
              const isActive = activeThreadId === thread.id;
              const isMatching = matchingThread?.id === thread.id;

              let threadClass = "";
              if (isActive) {
                threadClass = "border-blue-500 bg-blue-50 hover:bg-blue-100";
              } else if (isMatching) {
                threadClass =
                  "border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50";
              } else {
                threadClass =
                  "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50";
              }

              return (
                <div
                  key={thread.id}
                  // ✅ Reserve space so the delete button can slide in INSIDE the row
                  className="relative flex items-center group/thread max-w-full "
                >
                  {/* ✅ Sliding Delete Button (comes in from the right inside the row) */}
                  <button
                    type="button"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-fit
                      opacity-0 
                      group-hover/thread:opacity-100 group-hover/thread:translate-x-0
                      group-focus-within/thread:opacity-100 group-focus-within/thread:translate-x-0
                      transition-all duration-200
                      bg-red-500 text-white rounded-md p-1 shadow-lg 
                      hover:bg-red-600 cursor-pointer
                    `}
                    aria-label="Delete thread"
                    onClick={(event) => {
                      event.stopPropagation();
                      setThreadPendingDelete(thread);
                    }}
                    tabIndex={0}
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    type="button"
                    data-thread-id={thread.id}
                    className={`cursor-pointer w-full border rounded-lg p-2 transition-all ${threadClass}`}
                    onClick={() => handleThreadClick(thread.id)}
                    onKeyDown={() => { }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare
                        size={16}
                        className="flex-shrink-0 text-blue-500"
                      />
                      <p className="truncate text-left font-monlam-2">
                        {thread.selectedText}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No comments found.</p>
          </div>
        )}
      </div>

      <Dialog
        open={!!threadPendingDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDeletingThread) setThreadPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm space-y-5">
          <DialogHeader className="space-y-2">
            <DialogTitle>Delete thread?</DialogTitle>
            <DialogDescription>
              This conversation and its replies will be removed permanently.
            </DialogDescription>
          </DialogHeader>

          {threadPendingDelete?.selectedText ? (
            <div className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
              {threadPendingDelete.selectedText}
            </div>
          ) : null}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className="w-full cursor-pointer sm:w-auto"
              onClick={() => setThreadPendingDelete(null)}
              disabled={isDeletingThread}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full cursor-pointer sm:w-auto"
              onClick={handleConfirmDelete}
              disabled={isDeletingThread}
            >
              {isDeletingThread ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ThreadList;
