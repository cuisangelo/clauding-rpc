# Changelog

All notable changes to the Clauding VSCode extension are documented here.
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] — 2026-05-19

### Removed

- The link button on the Discord presence card is gone for good. The `clauding.buttonLabel` and `clauding.buttonUrl` settings no longer exist. The presence shows just the verb, state text, large image, and timer — no extra link.

## [0.3.0] — 2026-05-19

### Added

- **Status bar item** showing the current connection state (active / connecting / idle / paused). Click it to toggle Clauding on/off.
- **`Clauding: Toggle on/off`** command (bound to the status bar item click).
- The enabled/disabled state is now persisted per-user via `globalState`, so toggling off survives editor reloads.

### Changed

- The Discord presence link button is now **hidden by default**. Set `clauding.buttonLabel` (and optionally `clauding.buttonUrl`) in Settings to show one.

## [0.2.0] — 2026-05-19

### Added

- Discord Rich Presence active while VSCode or Cursor is open.
- 1 942 spinner verbs from the Claude Code community collection.
- 14 Clawd images rotating every 30 seconds (no consecutive repeats).
- Animated dots on the spinner verb: `Verb.` → `Verb..` → `Verb...` every 10 seconds.
- Auto-reconnect when Discord opens/closes.
- Zero-config experience: ships with a shared Discord Application that already has the 14 Clawds uploaded as assets.
- Settings UI for `clauding.discordClientId`, `clauding.frameMs`, `clauding.dotFrames`, `clauding.stateText`, `clauding.buttonLabel`, `clauding.buttonUrl`. Changes restart the presence automatically.
- Commands: **Clauding: Restart presence**, **Clauding: Stop presence**.
- Output channel "Clauding" for logs.

### Notes

This is the first public release. The extension is part of a [pnpm monorepo](https://github.com/cuisangelo/clauding-rpc) that also ships a standalone macOS daemon for users who want Rich Presence active outside of VSCode/Cursor too.
