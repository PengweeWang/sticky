import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { v4 as uuidv4 } from "uuid";
import { NOTE_COLORS, NOTE_SIZE, SHADOW_PAD } from "../types";
import { addActiveNote, updateActiveNotePos } from "../App";

const STORAGE_KEY = "sticky-current-color";

function StickyPad() {
  const [color, setColor] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || NOTE_COLORS[0];
  });
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState(() => uuidv4());
  const [fontSize, setFontSize] = useState(14);
  const isDragging = useRef(false);
  const dragRef = useRef({ startX: 0, startY: 0, noteX: 0, noteY: 0, stickyId: "" });
  const cardRef = useRef<HTMLDivElement>(null);
  const tearingOff = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, color);
  }, [color]);

  const getNoteScreenPos = useCallback(() => {
    const winX = window.screenX ?? 0;
    const winY = window.screenY ?? 0;
    return { x: winX, y: winY + 28 };
  }, []);

  const tearOff = useCallback(
    async (screenX: number, screenY: number) => {
      if (!content.trim() || tearingOff.current) return;
      tearingOff.current = true;

      const id = noteId;
      const notePos = getNoteScreenPos();
      const noteData = { id, content, color, width: NOTE_SIZE.width, height: NOTE_SIZE.height, fontSize };
      localStorage.setItem(`sticky-${id}`, JSON.stringify(noteData));

      const pad = SHADOW_PAD;
      const wx = Math.round(notePos.x);
      const wy = Math.round(notePos.y);
      try {
        await invoke("create_sticky", {
          noteId: id,
          x: wx,
          y: wy,
          width: NOTE_SIZE.width + pad * 2,
          height: NOTE_SIZE.height + pad * 2,
        });
      } catch (err) {
        console.error("Failed to create sticky:", err);
        localStorage.removeItem(`sticky-${id}`);
        tearingOff.current = false;
        return;
      }

      dragRef.current = {
        startX: screenX,
        startY: screenY,
        noteX: wx,
        noteY: wy,
        stickyId: id,
      };
      isDragging.current = true;

      addActiveNote(id, wx, wy);
      setNoteId(uuidv4());
      setContent("");
    },
    [content, color, noteId, getNoteScreenPos]
  );

  const moveSticky = useCallback(async (screenX: number, screenY: number) => {
    const d = dragRef.current;
    const dx = screenX - d.startX;
    const dy = screenY - d.startY;
    const nx = Math.round(d.noteX + dx);
    const ny = Math.round(d.noteY + dy);
    try {
      await invoke("move_sticky", {
        noteId: d.stickyId,
        x: nx,
        y: ny,
      });
      updateActiveNotePos(d.stickyId, nx, ny);
    } catch {
      // ignore
    }
  }, []);

  const finishDrag = useCallback(async () => {
    const stickyId = dragRef.current.stickyId;
    isDragging.current = false;
    tearingOff.current = false;

    try {
      await invoke("set_sticky_bottom", { noteId: stickyId });
    } catch {
      // ignore
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".color-dot")) return;
    if ((e.target as HTMLElement).closest(".note-header")) return;
    tearOff(e.screenX, e.screenY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      moveSticky(e.screenX, e.screenY);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      finishDrag();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [moveSticky, finishDrag]);

  const handleMinimize = async () => {
    try { await getCurrentWindow().minimize(); } catch { /* ignore */ }
  };

  const handleClose = async () => {
    try { await getCurrentWindow().hide(); } catch (e) { console.error("hide failed:", e); }
  };

  return (
    <div className="sticky-pad">
      <div className="pad-content">
        <div className="note-header" data-tauri-drag-region style={{ backgroundColor: color }}>
          <span className="title-text">Sticky Pad</span>
          <div className="title-controls">
            <button
              className="title-btn minimize"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
              title="Minimize"
            >
              &#x2014;
            </button>
            <button
              className="title-btn close"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              title="Close"
            >
              &#x2715;
            </button>
          </div>
        </div>

        <div
          ref={cardRef}
          className="note-card"
          style={{ backgroundColor: color }}
          onMouseDown={handleMouseDown}
        >
          <div className="adhesive-strip">
            {NOTE_COLORS.map((c) => (
              <div
                key={c}
                className={`color-dot${c === color ? " active" : ""}`}
                style={{ backgroundColor: c }}
                onClick={(e) => {
                  e.stopPropagation();
                  setColor(c);
                }}
              />
            ))}
          </div>

          <textarea
            className="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (e.ctrlKey) {
                e.preventDefault();
                setFontSize((s) => Math.min(24, Math.max(10, s - e.deltaY * 0.02)));
              }
            }}
            placeholder="Write your note here, then drag to stick on desktop..."
            style={{ backgroundColor: "transparent", fontSize, lineHeight: `${fontSize + 10}px` }}
          />
        </div>
      </div>
    </div>
  );
}

export default StickyPad;
