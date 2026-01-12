import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ENABLE_LIVE_COLLABORATION,
  MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION,
} from "@/utils/editorConfig";

function LiveBlockProvider({
  enabled = false,
  roomId,
  children,
}: {
  readonly enabled: boolean;
  readonly roomId: string;
  readonly children: React.ReactNode;
}) {
  const liveBlockKey = import.meta.env.VITE_LIVEBLOCK_KEY || "";

  if (!enabled || !liveBlockKey) {
    return <>{children}</>;
  }

  return (
    <LiveblocksProvider publicApiKey={liveBlockKey}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function deltaToPlainText(delta: any) {
  let text = "";
  if (!Array.isArray(delta)) return "";
  for (const op of delta) {
    // stop if we reach the footnote divider
    if (typeof op.insert === "object" && op.insert["footnote-divider"]) {
      break;
    } else {
      text += op.insert;
    }

    if (typeof op.insert === "string") {
      // append only non-footnote-row text
      if (!(op.attributes && op.attributes["footnote-row"])) {
        text += op.insert;
      }
    }
  }
  return text;
}

export const useLiveBlockActive = (currentDoc: any) => {
  const [isLiveEnabled, setIsLiveEnabled] = useState(false);
  useEffect(() => {
    if (!ENABLE_LIVE_COLLABORATION) {
      setIsLiveEnabled(false);
      return () => {};
    }
    // Calculate text length from Delta ops
    const ops = currentDoc?.currentVersion?.content.ops || [];

    const text = deltaToPlainText(ops);
    if (text.length > MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION) {
      setIsLiveEnabled(false);
      return () => {};
    }
    const textLength =
      ops.length > 0
        ? ops.reduce((total, op) => {
            if (typeof op.insert === "string") {
              return total + op.insert.length;
            }
            return total;
          }, 0)
        : 0;

    // Disable live collaboration if text length exceeds 10,000 characters
    setIsLiveEnabled(textLength <= MAX_TEXT_LENGTH_FOR_REALTIME_COLLABORATION);
  }, [currentDoc]);
  return isLiveEnabled;
};

export default LiveBlockProvider;
