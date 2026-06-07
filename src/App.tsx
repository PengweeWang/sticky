import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import StickyPad from "./components/StickyPad";
import StickyNote from "./components/StickyNote";
import { NOTE_SIZE, SHADOW_PAD } from "./types";
import "./App.css";

const ACTIVE_KEY = "sticky-active";

function App() {
  const [mode, setMode] = useState<"main" | "sticky" | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const note = params.get("note");
    if (note) {
      setMode("sticky");
      setNoteId(note);
    } else {
      setMode("main");
      restoreStickies();
    }

    const preventCtx = (e: MouseEvent) => e.preventDefault();
    // document.addEventListener("contextmenu", preventCtx);
    return () => document.removeEventListener("contextmenu", preventCtx);
  }, []);

  if (mode === null) return null;
  if (mode === "sticky" && noteId) return <StickyNote noteId={noteId} />;
  return <StickyPad />;
}

async function restoreStickies() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return;
    const list: { id: string; x: number; y: number }[] = JSON.parse(raw);
    const pad = SHADOW_PAD;
    const w = NOTE_SIZE.width + pad * 2;
    const h = NOTE_SIZE.height + pad * 2;
    for (const item of list) {
      await invoke("create_sticky", {
        noteId: item.id,
        x: item.x,
        y: item.y,
        width: w,
        height: h,
      });
    }
  } catch {
    // ignore
  }
}

export function addActiveNote(id: string, x: number, y: number) {
  const raw = localStorage.getItem(ACTIVE_KEY);
  const list: { id: string; x: number; y: number }[] = raw ? JSON.parse(raw) : [];
  list.push({ id, x, y });
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(list));
}

export function removeActiveNote(id: string) {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (!raw) return;
  const list: { id: string; x: number; y: number }[] = JSON.parse(raw);
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(list.filter((n) => n.id !== id)));
}

export function updateActiveNotePos(id: string, x: number, y: number) {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (!raw) return;
  const list: { id: string; x: number; y: number }[] = JSON.parse(raw);
  const idx = list.findIndex((n) => n.id === id);
  if (idx !== -1) {
    list[idx].x = x;
    list[idx].y = y;
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(list));
  }
}

export default App;
