export interface StickyNote {
  id: string;
  content: string;
  color: string;
  width: number;
  height: number;
  fontSize?: number;
}

export const NOTE_COLORS = [
  "#fdfd96",
  "#fff9ab",
  "#ffb6c1",
  "#ffcc99",
  "#c1f0c1",
  "#b4d8ff",
  "#d4c5f0",
  "#ffd700",
] as const;

export const NOTE_SIZE = { width: 280, height: 260 };
export const SHADOW_PAD = 0;
