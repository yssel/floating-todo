# Floating Todo

A sticky-note style to-do list for macOS that floats above all your windows — even fullscreen apps.

## Features

- 📌 **Always on top** — floats over every window, including fullscreen
- 💾 **Auto-saves** — your tasks and window position persist between sessions
- 🎨 **Sticky note look** — frameless, translucent, with macOS vibrancy
- 🖱️ **Draggable** — grab the top bar to move it anywhere
- 🔆 **Adjustable opacity** — make it as subtle or solid as you want
- 🍎 **Menu bar icon** — quick show/hide from your menu bar
- ⌨️ **Double-click to edit** any task
- ✨ **Lightweight** — single window, no bloat

## Setup

You'll need [Node.js](https://nodejs.org) installed (any recent LTS version).

```bash
# 1. Install dependencies
npm install

# 2. Run it
npm start
```

That's it — the floating note appears in the top right of your screen.

## Building a standalone .app

Want it as a real Mac app you can put in Applications?

```bash
# For Apple Silicon (M1/M2/M3/M4):
npm run package-mac

# For Intel Macs:
npm run package-mac-intel
```

This creates a `FloatingTodo-darwin-arm64/` (or `-x64`) folder containing `FloatingTodo.app`. Drag it to Applications and you're done.

> **Note:** Unsigned builds will trigger Gatekeeper on first launch. Right-click the app → Open → confirm. You only need to do this once.

## Usage tips

- **Add a task:** type and hit Enter
- **Complete a task:** click the checkbox
- **Edit a task:** double-click the text
- **Delete a task:** hover and click the ×
- **Move the window:** drag the top bar
- **Hide the window:** click × (the app keeps running in the menu bar)
- **Bring it back:** click the menu bar icon
- **Quit completely:** menu bar icon → right-click → Quit

## File layout

```
floating-todo/
├── package.json          # Dependencies and scripts
├── src/
│   ├── main.js           # Electron main process — window + tray + storage
│   ├── preload.js        # Secure IPC bridge
│   ├── index.html        # UI structure
│   ├── styles.css        # Sticky-note styling
│   └── renderer.js       # UI logic
└── assets/               # (Optional: drop an icon.icns here for a custom app icon)
```

## Where is my data saved?

`electron-store` saves to `~/Library/Application Support/floating-todo/config.json` on macOS. Delete that file to reset everything.

## Customization ideas

- Change the accent color: edit `--accent` in `src/styles.css`
- Change default window size/position: edit `defaults.windowBounds` in `src/main.js`
- Add a global hotkey to show/hide: use Electron's `globalShortcut` in `main.js`
