# Clauding

> Personal Discord Rich Presence that shows Claude working — Claude Code-style spinner verbs and **Clawd** (the Claude Code mascot) rotating in your profile every 30 seconds.

> ⚠️ **Unofficial, fan-made project.** Not affiliated with Anthropic. Clawd, Claude, and the artwork are property of [Anthropic](https://www.anthropic.com); this repo uses them under fair use for personal, non-commercial purposes.

```
┌─────────────────────────────────────┐
│  Playing Clauding                   │
│                                     │
│  ┌──────┐                           │
│  │ 🦀   │   Pondering…              │
│  │      │   with Claude             │
│  └──────┘   ⏱ 0:23 elapsed          │
│             [ claude.com ]          │
└─────────────────────────────────────┘
```

## ✨ Features

- **1,942 spinner verbs** from the [Claude Code community spinner verbs project](https://github.com/wynandw87/claude-code-spinner-verbs).
- **14 Clawds** processed from the [official Stickermule stickers](https://www.stickermule.com/claudecode) — no background, no sticker border, 1024 × 1024 transparent PNG.
- **Animated dots** every 10s (`Verb.` → `Verb..` → `Verb...`) + verb + Clawd swap every 30s.
- **Auto-reconnect** when Discord opens/closes.
- **Two deployment modes**:
  - 🌐 **Daemon** — always running on macOS (regardless of whether VSCode/Cursor is open).
  - 🧩 **VSCode/Cursor extension** — only active while the editor is open.

---

## 📁 Monorepo structure

Uses [pnpm workspaces](https://pnpm.io/workspaces):

```
clauding/
├── packages/
│   ├── core/          # @clauding/core — shared logic (verbs, CLAWDS, ClaudingPresence class)
│   ├── daemon/        # @clauding/daemon — standalone Node CLI
│   └── extension/     # clauding (VSCode extension) — activate/deactivate
├── assets/
│   └── stickers/
│       ├── originals/ # raw Stickermule stickers
│       └── processed/ # 1024 × 1024 transparent PNGs ready for Discord
├── scripts/
│   └── process_stickers.py
├── Clauding.app/      # macOS wrapper for Login Items
└── launchd/           # LaunchAgent template
```

---

## 📋 Requirements

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) 10+
- **Discord desktop client** running (the web/PWA client doesn't expose the IPC socket Rich Presence needs)
- Discord Developer account (free) — only required if you want to use your own Application
- Python 3 + [Pillow](https://python-pillow.org) — only if you want to run the sticker processing pipeline

---

## 🚀 Setup

### Extension mode (recommended for most users)

**Zero configuration.** The extension ships with a shared Discord Application (`Clauding`) that already has all 14 Clawds uploaded. Just install:

```bash
# if you already have the .vsix built
code --install-extension packages/extension/clauding.vsix
# or
cursor --install-extension packages/extension/clauding.vsix
```

Then: **Reload Window** (`Cmd+Shift+P` → "Developer: Reload Window"). The presence starts automatically as long as Discord desktop is open. **No Discord Application setup or asset uploading required.**

Want your own Discord App (custom branding, private stats)? Override `clauding.discordClientId` in *Settings* — then you'll need the full setup below.

### Daemon mode or full setup from scratch

If you want the standalone daemon, or want to use your own Discord App with the extension:

#### 1. Clone and build

```bash
git clone https://github.com/cuisangelo/clauding-rpc.git
cd clauding-rpc
pnpm install
pnpm build
```

#### 2. Create the Discord Application

1. <https://discord.com/developers/applications> → **New Application**
2. Name: `Clauding` (Discord blocks "Claude" due to trademark)
3. Accept ToS and create
4. Copy the **Application ID** from *General Information*
5. (Optional) Upload an App Icon → appears as "Playing Clauding" with your logo

#### 3. Upload the assets to Discord

Go to **Rich Presence → Art Assets → Add Image(s)** and upload all 14 PNGs from `assets/stickers/processed/` with these keys (case-sensitive, hyphenated):

| File | Key |
|---|---|
| `clawd.png` | `clawd` |
| `clawd-book.png` | `clawd-book` |
| `clawd-bubble.png` | `clawd-bubble` |
| `clawd-cape.png` | `clawd-cape` |
| `clawd-coffee.png` | `clawd-coffee` |
| `clawd-dizzy.png` | `clawd-dizzy` |
| `clawd-happy.png` | `clawd-happy` |
| `clawd-headphones.png` | `clawd-headphones` |
| `clawd-heart.png` | `clawd-heart` |
| `clawd-kite.png` | `clawd-kite` |
| `clawd-lightbulb.png` | `clawd-lightbulb` |
| `clawd-magnifier.png` | `clawd-magnifier` |
| `clawd-skateboard.png` | `clawd-skateboard` |
| `clawd-wand.png` | `clawd-wand` |

> ⚠️ Assets take **5–10 minutes** to propagate through Discord's CDN.
> ⚠️ Keys **cannot be edited** once saved — only deleted and re-uploaded.

---

## 🌐 Daemon mode (macOS)

Runs in the background whether your editor is open or not. Auto-detects Discord opening/closing.

### Configure

```bash
cp .env.example .env
# edit .env:
# DISCORD_CLIENT_ID=123456789012345678
```

### Run manually

```bash
pnpm daemon
```

You should see `Connected as <your_username>` and the presence appears in your profile.

### Autostart on each login

```bash
cp launchd/com.claude.presence.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.claude.presence.plist
```

To make it appear as **"Clauding"** in *System Settings → Login Items* with the Claude icon (instead of `node` with a generic icon):

```bash
swift -e 'import AppKit
let icon = NSImage(contentsOfFile: "Clauding.app/Contents/Resources/icon.icns")!
_ = NSWorkspace.shared.setIcon(icon, forFile: "Clauding.app/Contents/MacOS/Clauding", options: [])'
```

Useful commands:

```bash
tail -f launchd.out.log                                                  # live logs
launchctl unload ~/Library/LaunchAgents/com.claude.presence.plist        # pause
launchctl load ~/Library/LaunchAgents/com.claude.presence.plist          # resume
```

> ℹ️ Linux/Windows: the daemon itself is portable (plain Node). Only the autostart wrapper changes — use systemd or Task Scheduler accordingly.

---

## 🧩 VSCode / Cursor extension mode

Only active while the editor is open. Ships with the shared Discord App pre-configured, so **it works without any setup**. Takes advantage of the VSCode API (settings UI, output channel, commands).

### Local installation

```bash
pnpm build
pnpm extension:package    # produces packages/extension/clauding.vsix

# VSCode
code --install-extension packages/extension/clauding.vsix

# Cursor (it's a VSCode fork — the same .vsix works)
cursor --install-extension packages/extension/clauding.vsix
```

Then: `Cmd+Shift+P` → "Developer: Reload Window".

### Optional: override with your own Discord App

By default the extension uses the shared `Clauding` app (ID `1506350478714208378`, with the 14 Clawds pre-uploaded). If you want your own:

1. Follow "Full setup from scratch" above to create your Discord App + upload the 14 assets
2. *Settings* (`Cmd+,`) → search `clauding`
3. Paste your **Application ID** into `Clauding: Discord Client Id`
4. Reload Window

### Available commands

- `Clauding: Restart presence` — reconnect manually
- `Clauding: Stop presence` — pause until next restart/reload

### Available settings

| Setting | Default | Description |
|---|---|---|
| `clauding.discordClientId` | `"1506350478714208378"` | Discord Application ID. Defaults to the shared Clauding app. |
| `clauding.frameMs` | `10000` | ms between dot frames (min. 5,000 due to Discord rate limit) |
| `clauding.dotFrames` | `3` | Dots per verb (1–6) |
| `clauding.stateText` | `"with Claude"` | Text below the verb |
| `clauding.buttonLabel` | `"claude.com"` | Button label (empty to hide) |
| `clauding.buttonUrl` | `"https://claude.com"` | Button URL |

---

## 🎨 Customization

### Add new Clawds

1. Drop the new PNG into `assets/stickers/originals/`
2. `pnpm process-stickers` (requires Python + Pillow)
3. Upload the result from `assets/stickers/processed/` to the Discord Developer Portal with a key (no file extension)
4. Add the key to the `CLAWDS` array in `packages/core/src/clawds.ts`
5. `pnpm build`
6. Restart the daemon or reload the extension

### Change the verbs

Edit `packages/core/src/verbs.ts`. Then `pnpm build`.

### Tune timings (daemon)

Edit `packages/daemon/src/index.ts` and pass options to the `ClaudingPresence` constructor:

```ts
const presence = new ClaudingPresence({
  clientId,
  frameMs: 8_000,
  dotFrames: 4,
  stateText: 'cooking',
  log,
})
```

### Tune timings (extension)

Everything is configurable from Settings — no recompile needed.

---

## 🛠 Sticker processing pipeline

`scripts/process_stickers.py` takes the PNGs from `assets/stickers/originals/` and produces 1024 × 1024 transparent PNGs ready for Discord:

1. **Flood-fill from the perimeter** through white *or* transparent pixels — clears the background + sticker border in one pass.
2. **Crop to the bounding box** of visible content.
3. **NEAREST upscale** if smaller than 300 px (preserves crisp pixel art).
4. **Padding** to square + LANCZOS resize to 1024 × 1024.
5. **Alpha threshold** (α < 128 → 0, ≥ 128 → 255) — kills anti-aliasing.
6. **Anti-ringing** — clears the dark low-alpha pixels LANCZOS leaves at edges.
7. **White killer** — any RGB ≥ 240 dies (Clawds have no white in the design).

---

## 🐛 Troubleshooting

**"Connected as ..." but I see nothing in my profile**
→ Discord *Settings → Activity Privacy → Share your detected activities* must be ON.

**I see a broken / placeholder image**
→ Freshly uploaded assets take 5–10 min to propagate through Discord's CDN.

**Daemon doesn't start after `pnpm install`**
→ Run `pnpm build` (packages compile to `dist/`).

**Login Items shows "node" with a generic icon**
→ You're pointing at the binary directly. Use the `Clauding.app` bundle and run the Swift command from the autostart section.

**iPhone Screen Time shows `com.claude.presence` with a blank icon**
→ Apple limitation — Screen Time only renders proper icons when there's an exact bundle-ID match in the iOS App Store. No user-side fix exists; even Apple's own `com.apple.Terminal` shows this way.

---

## 📦 Stack

- TypeScript across all 3 packages
- [`@xhayper/discord-rpc`](https://github.com/xhayper/discord-rpc) — maintained Rich Presence IPC client
- [`dotenv`](https://github.com/motdotla/dotenv) — daemon env vars
- [`@vscode/vsce`](https://github.com/microsoft/vscode-vsce) + [`esbuild`](https://esbuild.github.io) — extension bundling and packaging
- Python + [Pillow](https://python-pillow.org) — sticker processing pipeline
- Swift + AppKit — custom icon on the inner macOS bundle binary

---

## 📜 License

MIT. See [`LICENSE`](LICENSE). The Clawd character, Claude branding, and related artwork are property of [Anthropic](https://www.anthropic.com); use the assets for personal, non-commercial purposes only.
