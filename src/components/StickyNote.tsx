import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import type { StickyNote as StickyNoteType } from "../types";
import { removeActiveNote, updateActiveNotePos } from "../App";

interface StickyNoteProps {
  noteId: string;
}

function StickyNote({ noteId }: StickyNoteProps) {
  const [note, setNote] = useState<StickyNoteType | null>(null);
  const [pinned, setPinned] = useState(false);
  const [rotation, setRotation] = useState(0);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const data = localStorage.getItem(`sticky-${noteId}`);
    if (data) {
      const parsed = JSON.parse(data);
      setNote(parsed);
      setRotation(parsed.rotation || 0);
      if (parsed.pinned) setPinned(true);
    }
  }, [noteId]);

  const handlePointerDown = useCallback(
    async (e: React.PointerEvent) => {
      if (pinned) return;
      if ((e.target as HTMLElement).closest(".sticky-controls button")) return;
      try {
        await appWindow.startDragging();
      } catch {
        // ignore
      }
    },
    [pinned, appWindow]
  );

  const togglePin = () => {
    setPinned((prev) => {
      const next = !prev;
      const data = localStorage.getItem(`sticky-${noteId}`);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.pinned = next;
        localStorage.setItem(`sticky-${noteId}`, JSON.stringify(parsed));
      }
      return next;
    });
  };

  const handleDelete = async () => {
    localStorage.removeItem(`sticky-${noteId}`);
    removeActiveNote(noteId);
    try {
      await invoke("delete_sticky", { noteId });
    } catch {
      // ignore
    }
    appWindow.close();
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        unlisten = await appWindow.onMoved((e) => {
          updateActiveNotePos(noteId, e.payload.x, e.payload.y);
        });
      } catch { /* ignore */ }
    })();
    return () => { unlisten?.(); };
  }, [noteId, appWindow]);

  if (!note) return null;

  return (
    <div className="sticky-note-window">
      <div
        className="note-card"
        style={{
          backgroundColor: note.color,
          cursor: pinned ? "default" : "grab",
          transform: `rotate(${rotation}deg)`,
        }}
        onPointerDown={handlePointerDown}
      >
        <div className="adhesive-strip">
          <div className="sticky-controls">
            <button
              className={`pin-btn${pinned ? " pinned" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                togglePin();
              }}
              title={pinned ? "Unpin" : "Pin"}
            >
              {pinned ? "\u{1F4CC}" : "\u{1F4CD}"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              title="Delete"
            >
              {"✕"}
            </button>
          </div>
        </div>

        <div
          className="note-content-readonly"
          style={{
            fontSize: note.fontSize || 14,
            lineHeight: `${(note.fontSize || 14) + 10}px`,
          }}
        >
          {note.content}
        </div>
      </div>
    </div>
  );
}

export default StickyNote;
