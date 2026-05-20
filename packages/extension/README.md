# Clauding

> ⚠️ **Unofficial fan-made extension.** Not affiliated with, endorsed by, or sponsored by Anthropic. Clawd, Claude, and related artwork are property of [Anthropic](https://www.anthropic.com); this project uses them under fair use for non-commercial personal projects.

Discord Rich Presence with Claude Code-style spinner verbs and **Clawd** (the Claude Code mascot) rotating in your profile — active only while VSCode or Cursor is open.

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

## Features

- **1 942 spinner verbs** from the [Claude Code community collection](https://github.com/wynandw87/claude-code-spinner-verbs) — Pondering, Cogitating, Schlepping, Vibing, and 1 938 more.
- **14 different Clawds** rotating with the verb — coffee, dizzy, headphones, heart, lightbulb, magnifier, skateboard, wand, book, bubble, cape, kite, happy, base.
- **Animated dot effect** every 10 seconds: `Verb.` → `Verb..` → `Verb...`
- **Verb + Clawd rotation** every 30 seconds, no consecutive repeats.
- **Auto-reconnect** when Discord opens or closes — the extension idles cleanly when Discord isn't around.
- **Zero configuration** — ships with a shared Discord Application that already has all 14 Clawds uploaded. Install → reload → working.
- Works in **Cursor** too (it's a VSCode fork).

## Setup

1. Install the extension.
2. Make sure Discord desktop is running (the web/PWA client doesn't expose the IPC socket that Rich Presence needs).
3. **Reload Window** (`Cmd+Shift+P` → "Developer: Reload Window") — the extension activates `onStartupFinished`, so a fresh window is required after install.
4. Open your Discord profile — you should see "Playing Clauding" with a Clawd and a spinner verb.

That's it. No Discord Developer account, no asset uploading, no config required.

## Commands

- `Clauding: Restart presence` — reconnect manually.
- `Clauding: Stop presence` — pause until you restart or reload.

## Settings

| Setting | Default | Description |
|---|---|---|
| `clauding.discordClientId` | `1506350478714208378` | Discord Application ID. Defaults to the shared `Clauding` app (with all 14 Clawds pre-uploaded). Override only if you want your own branding. |
| `clauding.frameMs` | `10000` | Milliseconds between dot frames. Discord rate-limits to ~5 updates per 20s — keep ≥ 5 000. |
| `clauding.dotFrames` | `3` | Dots per verb before rotating to the next verb + Clawd. |
| `clauding.stateText` | `with Claude` | Text shown below the verb. |
| `clauding.buttonLabel` | `claude.com` | Link button label. Leave empty to hide the button. |
| `clauding.buttonUrl` | `https://claude.com` | URL the link button opens. |

Changes to settings restart the presence automatically — no reload needed.

## Want your own Discord Application?

The default works out of the box, but if you want to count Clauding usage under your own Discord app, customize the App icon, or replace the Clawds with your own art:

1. Create an Application at <https://discord.com/developers/applications> (Discord blocks "Claude" as a name; "Clauding" works).
2. Copy the **Application ID** from *General Information*.
3. Upload your assets under **Rich Presence → Art Assets** with the key names listed in the [main repo README](https://github.com/cuisangelo/clauding-rpc#3-subir-los-assets-a-discord).
4. In VSCode/Cursor settings, set `clauding.discordClientId` to your Application ID.

## Troubleshooting

**"Connected as ..." but I see nothing in my Discord profile**
→ Discord *Settings → Activity Privacy → Share your detected activities* must be ON.

**Image shows as broken / placeholder**
→ Only happens with a custom Application ID — your freshly uploaded assets take 5–10 minutes to propagate through Discord's CDN.

**Nothing happens after install**
→ Run "Developer: Reload Window". The extension activates `onStartupFinished`, which only fires on a fresh editor start.

**Extension is running but the profile doesn't update**
→ Discord caches profile renders. Close and reopen your profile in Discord, or check the *Output → Clauding* channel for logs.

## Companion standalone daemon

This extension is part of a larger project that also ships a standalone macOS daemon (active even when VSCode/Cursor is closed). See the [full repo](https://github.com/cuisangelo/clauding-rpc) for both setup paths.

## Credits

- **Spinner verbs**: [wynandw87/claude-code-spinner-verbs](https://github.com/wynandw87/claude-code-spinner-verbs)
- **Clawd artwork**: Anthropic, via the public [Stickermule Claude Code store](https://www.stickermule.com/claudecode)
- **Discord RPC**: [@xhayper/discord-rpc](https://github.com/xhayper/discord-rpc)

## License

[MIT](LICENSE.txt). Clawd, Claude branding, and related artwork are property of [Anthropic](https://www.anthropic.com); use for personal, non-commercial purposes only.
