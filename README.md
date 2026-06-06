# Sticky

<img src="logo.png" alt="Sticky" width="64" align="left" style="margin-right: 16px;">

Desktop sticky notes app built with [Tauri 2](https://v2.tauri.app/) + React + TypeScript.

Write notes on a pad, tear them off, and they stick to your desktop — just like real sticky notes. Write once, read forever, only deletable.

<br clear="left">

## Screenshot

![Sticky Screenshot](assets/display.png)

## Features

- **Tear-off flow** — write on the main pad, drag out to create a posted sticky on the desktop
- **Immutable stickies** — once posted, content is read-only; only deletable
- **Always on bottom** — sticky windows sit beneath all other windows, pinned to the desktop
- **Pin to lock** — pin a sticky to fix it in place and prevent accidental moves
- **Transparent windows** — only the note card is visible, creating a natural desk feel
- **System tray** — left-click to show/hide, right-click menu for Show/Hide and Quit
- **Persistence** — posted stickies survive restarts; window positions are restored
- **Font scaling** — Ctrl + scroll in the editor to adjust text size

## Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- [Rust](https://www.rust-lang.org/) (latest stable)
- Windows 10 / 11

## Quick Start

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

The installer will be in `src-tauri/target/release/bundle/`.

## Usage

| Action | How |
|--------|-----|
| Write a note | Type in the textarea on the main pad |
| Change color | Click a color dot on the adhesive strip |
| Post to desktop | Click the note card and drag |
| Move a sticky | Drag the sticky window (when unpinned) |
| Pin / Unpin | Hover over sticky, click 📌 |
| Delete a sticky | Hover over sticky, click ✕ |
| Adjust font size | Ctrl + scroll while editing |
| Hide to tray | Click ✕ on the note header |
| Quit | Right-click tray icon → Quit |

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Tauri 2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Plain CSS |
| Plugins | `window-state`, `opener` |

## Project Structure

```
src/
  App.tsx                    # Entry routing (main pad vs sticky window)
  App.css                    # Global styles
  types.ts                   # Shared types & constants
  main.tsx                   # React mount point
  components/
    StickyPad.tsx             # Main writing pad window
    StickyNote.tsx            # Posted sticky window
src-tauri/
  src/
    main.rs                   # Rust entry point
    lib.rs                    # Tauri builder, tray icon, plugin setup
    commands.rs               # create_sticky, move_sticky, delete_sticky
    window_utils.rs           # Win32 always-on-bottom
  Cargo.toml
  tauri.conf.json
```

## License

MIT
