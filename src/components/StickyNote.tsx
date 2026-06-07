import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import type { StickyNote as StickyNoteType } from "../types";
import { removeActiveNote, updateActiveNotePos } from "../App";

interface StickyNoteProps {
  noteId: string;
}

function renderContent(
  content: string,
  fontSize: number,
  onToggle?: (lineIdx: number) => void
) {
  const lines = content.split("\n");
  const lineH = fontSize + 10;
  const cbSize = Math.max(fontSize, 12);
  const cbTop = Math.round(((lineH - fontSize) / 2 - (cbSize - fontSize) / 2) - 1);
  return lines.map((line, i) => {
    const taskMatch = line.match(/^(?:- ?)?(\[|【)( |x|)(\]|】) ?(.+)/);
    if (taskMatch) {
      const checked = taskMatch[2] === "x";
      const text = taskMatch[4];
      return (
        <div key={i} className="task-line" style={{ minHeight: lineH }}>
          <span
            className={`task-cb${checked ? " checked" : ""}`}
            style={{ width: cbSize, height: cbSize, marginTop: cbTop }}
            onClick={(e) => { e.stopPropagation(); onToggle?.(i); }}
          >
            {checked && <span className="task-checkmark" style={{ fontSize }}>✓</span>}
          </span>
          <span className={`task-label${checked ? " done" : ""}`}>{text}</span>
        </div>
      );
    }
    return (
      <div key={i} className="text-line" style={{ minHeight: lineH }}>
        {line || " "}
      </div>
    );
  });
}

function StickyNote({ noteId }: StickyNoteProps) {
  const [note, setNote] = useState<StickyNoteType | null>(null);
  const [pinned, setPinned] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const data = localStorage.getItem(`sticky-${noteId}`);
    if (data) {
      const parsed = JSON.parse(data);
      setNote(parsed);
      if (parsed.pinned) setPinned(true);
    }
  }, [noteId]);

  const toggleTask = useCallback((lineIdx: number) => {
    setNote((prev) => {
      if (!prev) return prev;
      const lines = prev.content.split("\n");
      lines[lineIdx] = lines[lineIdx].replace(
        /^(- ?)?(\[|【)( |x|)(\]|】)/,
        (_, prefix, open, state, close) => `${prefix || ""}${open}${state === "x" ? " " : "x"}${close}`
      );
      const updated = { ...prev, content: lines.join("\n") };
      localStorage.setItem(`sticky-${noteId}`, JSON.stringify(updated));
      return updated;
    });
  }, [noteId]);

  const handlePointerDown = useCallback(
    async (e: React.PointerEvent) => {
      if (pinned) return;
      if ((e.target as HTMLElement).closest(".sticky-controls button")) return;
      if ((e.target as HTMLElement).closest(".task-cb")) return;
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
        }}
        onPointerDown={handlePointerDown}
      >
        <div className="adhesive-strip sticky-adhesive">
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
          </div>
          <div className="sticky-controls">
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
          {renderContent(note.content, note.fontSize || 14, toggleTask)}
        </div>
      </div>
    </div>
  );
}

export default StickyNote;
