# Clauding

Mi Discord Rich Presence personal: muestra a Claude trabajando con verbos rotando estilo Claude Code y a **Clawd** (la mascota oficial de Claude Code) cambiando junto con cada verbo.

```
┌──────────────────────────────────────┐
│  Playing Clauding                    │
│                                      │
│  ┌────┐                              │
│  │🦀  │   Pondering…                 │
│  │    │   with Claude                │
│  └────┘   ⏱  0:23 elapsed            │
│           [ claude.com ]             │
└──────────────────────────────────────┘
```

- **1942 verbos** (Pondering, Cogitating, Schlepping, Vibing, …) extraídos del [proyecto comunitario de spinner verbs](https://github.com/wynandw87/claude-code-spinner-verbs).
- **10 Clawds** distintos (coffee, dizzy, headphones, heart, lightbulb, magnifier, skateboard, wand, happy, base) procesados desde los [stickers oficiales de Claude Code en Stickermule](https://www.stickermule.com/claudecode).
- Cada **30 segundos** se elige verbo y Clawd nuevos.
- Cada **10 segundos** los dots animan: `Verbo.` → `Verbo..` → `Verbo...`
- Se conecta y desconecta solo cuando Discord se abre/cierra.

## Setup

```bash
pnpm install
cp .env.example .env
# pegar tu Discord Application ID en .env
pnpm start
```

Para autostart en macOS (corre solo al iniciar sesión, sin Dock icon):

```bash
cp launchd/com.claude.presence.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.claude.presence.plist
```

## Cómo funciona

- `src/index.js` — cliente Discord RPC con auto-reconnect.
- `src/verbs.js` — los 1942 verbos.
- `scripts/process_stickers.py` — pipeline que toma los stickers crudos de Stickermule, les quita el fondo y borde, y normaliza todo a 1024×1024 PNG transparente listo para Discord.
- `Clauding.app/` — wrapper bundle de macOS para que en *Login Items* aparezca como "Clauding" con el ícono de Claude en vez de "node".
- `launchd/com.claude.presence.plist` — LaunchAgent para autostart.

## Stack

Node.js + [@xhayper/discord-rpc](https://github.com/xhayper/discord-rpc) + Python/Pillow para procesar los stickers.

## Limitaciones de Discord RPC

- Las imágenes deben ser estáticas (PNG/JPG, no GIF).
- Rate limit: ~5 updates / 20 segundos, por eso los frames cada 10s.
- Las asset keys son case-sensitive y no se pueden editar después de subidas.
