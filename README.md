# Clauding

> Discord Rich Presence personal que muestra a Claude trabajando — con verbos rotando estilo Claude Code y a **Clawd** (la mascota oficial de Claude Code) cambiando cada 30 segundos.

> ⚠️ **Proyecto no oficial, hecho por fans.** No afiliado a Anthropic. Clawd, Claude y el artwork son propiedad de [Anthropic](https://www.anthropic.com); este repo los usa bajo fair use para uso personal no comercial.

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

## ✨ Características

- **1 942 verbos** del [proyecto comunitario de spinner verbs de Claude Code](https://github.com/wynandw87/claude-code-spinner-verbs).
- **14 Clawds** procesados desde los [stickers oficiales de Stickermule](https://www.stickermule.com/claudecode) — sin fondo, sin borde, 1024 × 1024 PNG transparente.
- **Animación de dots** cada 10 s (`Verbo.` → `Verbo..` → `Verbo...`) + cambio de verbo + Clawd cada 30 s.
- **Auto-reconnect** cuando Discord abre/cierra.
- **Dos modos de uso**:
  - 🌐 **Daemon** — corre todo el tiempo en macOS (con o sin VSCode/Cursor abierto).
  - 🧩 **Extensión VSCode/Cursor** — sólo activo cuando el editor está abierto.

---

## 📁 Estructura del monorepo

Usa [pnpm workspaces](https://pnpm.io/workspaces):

```
clauding/
├── packages/
│   ├── core/          # @clauding/core — lógica compartida (verbs, CLAWDS, ClaudingPresence class)
│   ├── daemon/        # @clauding/daemon — Node CLI standalone
│   └── extension/     # clauding (VSCode extension) — activate/deactivate
├── assets/
│   └── stickers/
│       ├── originals/ # stickers crudos de Stickermule
│       └── processed/ # PNGs 1024×1024 transparentes listos para Discord
├── scripts/
│   └── process_stickers.py
├── Clauding.app/      # wrapper macOS para Login Items
└── launchd/           # template del LaunchAgent
```

---

## 📋 Requisitos

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) 10+
- Cliente de **Discord desktop** corriendo (web/PWA no expone IPC)
- Cuenta de Discord Developer (gratis) para crear la Application
- Python 3 + [Pillow](https://python-pillow.org) si querés correr el pipeline de procesamiento

---

## 🚀 Setup

### Modo extension (recomendado para la mayoría)

**Cero configuración** — la extension trae bakeada una Discord Application compartida (`Clauding`) con los 14 Clawds ya subidos. Sólo instalá:

```bash
# si tenés el .vsix ya buildeado
code --install-extension packages/extension/clauding.vsix
# o
cursor --install-extension packages/extension/clauding.vsix
```

Después: **Reload Window** (`Cmd+Shift+P` → "Developer: Reload Window") y la presence arranca sola con Discord desktop abierto. **No tenés que crear ninguna app en Discord ni subir assets.**

¿Querés tu propia Discord App (custom branding, stats privadas)? Override en *Settings* → `clauding.discordClientId` con tu Application ID — entonces sí necesitás los pasos de abajo.

### Modo daemon o setup desde cero

Si vas por el daemon standalone, o querés usar tu propia Discord App con la extension:

#### 1. Clonar y compilar

```bash
git clone https://github.com/cuisangelo/discord-rich-presence.git
cd discord-rich-presence
pnpm install
pnpm build
```

#### 2. Crear la Discord Application

1. <https://discord.com/developers/applications> → **New Application**
2. Nombre: `Clauding` (Discord bloquea "Claude" por marca registrada)
3. Aceptar ToS y crear
4. Copiá el **Application ID** de *General Information*
5. (Opcional) Subí un App Icon → aparece como "Playing Clauding" con tu logo

#### 3. Subir los assets a Discord

Andá a **Rich Presence → Art Assets → Add Image(s)** y subí los 14 PNG de `assets/stickers/processed/` con estas keys (case-sensitive, con guión medio):

| Archivo | Key |
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

> ⚠️ Los assets tardan **5–10 minutos** en propagar.
> ⚠️ Las keys **no se pueden editar** una vez subidas.

---

## 🌐 Modo Daemon (macOS)

Corre en background con o sin editor abierto. Auto-detecta apertura/cierre de Discord.

### Configuración

```bash
cp .env.example .env
# editá .env:
# DISCORD_CLIENT_ID=123456789012345678
```

### Probar manualmente

```bash
pnpm daemon
```

Deberías ver `Connected as <tu_username>` y la presence aparece en tu perfil.

### Autostart en cada login

```bash
cp launchd/com.claude.presence.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.claude.presence.plist
```

Para que en *System Settings → Login Items* aparezca como **"Clauding"** con el ícono de Claude en vez de `node` con ícono genérico:

```bash
swift -e 'import AppKit
let icon = NSImage(contentsOfFile: "Clauding.app/Contents/Resources/icon.icns")!
_ = NSWorkspace.shared.setIcon(icon, forFile: "Clauding.app/Contents/MacOS/Clauding", options: [])'
```

Comandos útiles:

```bash
tail -f launchd.out.log                                                  # logs en vivo
launchctl unload ~/Library/LaunchAgents/com.claude.presence.plist        # pausar
launchctl load ~/Library/LaunchAgents/com.claude.presence.plist          # reanudar
```

> ℹ️ Linux/Windows: el daemon es portable (Node puro), solo el wrapper de autostart cambia (systemd / Task Scheduler).

---

## 🧩 Modo VSCode / Cursor extension

Sólo activo mientras el editor está abierto. Trae bakeada la Discord App compartida, así que **funciona sin config**. Aprovecha la API de VSCode (settings UI, output channel, commands).

### Instalación local

```bash
pnpm build
pnpm extension:package    # genera packages/extension/clauding.vsix

# VSCode
code --install-extension packages/extension/clauding.vsix

# Cursor (es VSCode fork, mismo .vsix funciona)
cursor --install-extension packages/extension/clauding.vsix
```

Después: `Cmd+Shift+P` → "Developer: Reload Window".

### Override opcional con tu propia Discord App

Por default usa la app `Clauding` compartida (ID `1506350478714208378`, con los 14 Clawds ya subidos). Si querés tu propia:

1. Seguí "Setup desde cero" arriba para crear tu Discord App + subir los 14 assets
2. *Settings* (`Cmd+,`) → buscá `clauding`
3. Pegá tu **Application ID** en `Clauding: Discord Client Id`
4. Reload Window

### Comandos disponibles

- `Clauding: Restart presence` — reconectar manualmente
- `Clauding: Stop presence` — pausar hasta el próximo restart/reload

### Settings disponibles

| Setting | Default | Descripción |
|---|---|---|
| `clauding.discordClientId` | `""` | Tu Discord Application ID |
| `clauding.frameMs` | `10000` | ms entre frames de dots (mín. 5 000 por rate limit) |
| `clauding.dotFrames` | `3` | Dots por verbo (1–6) |
| `clauding.stateText` | `"with Claude"` | Texto debajo del verbo |
| `clauding.buttonLabel` | `"claude.com"` | Label del botón (vacío para ocultar) |
| `clauding.buttonUrl` | `"https://claude.com"` | URL del botón |

---

## 🎨 Personalización

### Agregar nuevos Clawds

1. Dejá el PNG nuevo en `assets/stickers/originals/`
2. `pnpm process-stickers` (requiere Python + Pillow)
3. Subí el resultado de `assets/stickers/processed/` al Discord Developer Portal con una key (sin extensión)
4. Agregá la key al array `CLAWDS` en `packages/core/src/clawds.ts`
5. `pnpm build`
6. Reiniciá el daemon o reload de la extensión

### Cambiar los verbos

Editá `packages/core/src/verbs.ts`. Después `pnpm build`.

### Ajustar tiempos (daemon)

Editá `packages/daemon/src/index.ts` y pasale opciones al constructor de `ClaudingPresence`:

```ts
const presence = new ClaudingPresence({
  clientId,
  frameMs: 8_000,
  dotFrames: 4,
  stateText: 'cooking',
  log,
})
```

### Ajustar tiempos (extension)

Todo configurable desde Settings — sin recompilar.

---

## 🛠 Pipeline de procesamiento de stickers

`scripts/process_stickers.py` toma los PNGs de `assets/stickers/originals/` y produce 1024 × 1024 transparentes listos para Discord:

1. **Flood-fill desde el perímetro** por blanco *o* transparente — limpia fondo + borde de sticker.
2. **Crop al bounding box** del contenido visible.
3. **Upscale NEAREST** si < 300 px (preserva pixel-art crujiente).
4. **Padding** a cuadrado + resize a 1024 × 1024 LANCZOS.
5. **Alpha threshold** (α < 128 → 0, ≥ 128 → 255) — mata anti-aliasing.
6. **Anti-ringing** — limpia los píxeles oscuros con α bajo que LANCZOS deja en bordes.
7. **White killer** — cualquier RGB ≥ 240 muere (los Clawds no tienen blanco en el diseño).

---

## 🐛 Troubleshooting

**"Connected as ..." pero no veo nada en mi perfil**
→ Discord *Settings → Activity Privacy → Share your detected activities* tiene que estar ON.

**Veo imagen rota / placeholder**
→ Los assets recién subidos tardan 5–10 min en propagar en el CDN de Discord.

**El daemon no arranca tras `pnpm install`**
→ Corré `pnpm build` (los paquetes compilan a `dist/`).

**Login Items muestra "node" con ícono genérico**
→ Estás apuntando al binario directo. Usá el bundle `Clauding.app` y aplicá el comando Swift de la sección de autostart.

**iPhone Screen Time muestra `com.claude.presence` con ícono blanco**
→ Limitación de Apple — Screen Time pinta icono solo cuando hay match exacto de bundle ID en el App Store iOS. Sin solución de usuario.

---

## 📦 Stack

- TypeScript en los 3 packages
- [`@xhayper/discord-rpc`](https://github.com/xhayper/discord-rpc) — cliente IPC mantenido del Rich Presence
- [`dotenv`](https://github.com/motdotla/dotenv) — env vars del daemon
- [`@vscode/vsce`](https://github.com/microsoft/vscode-vsce) + [`esbuild`](https://esbuild.github.io) — bundling y packaging de la extensión
- Python + [Pillow](https://python-pillow.org) — pipeline de procesamiento de stickers
- Swift + AppKit — set custom icon en el binario del bundle macOS

---

## 📜 Licencia

MIT. Ver [`LICENSE`](LICENSE). El logo, los stickers de Clawd y la marca Claude son propiedad de [Anthropic](https://www.anthropic.com); usá los assets sólo para uso personal o no comercial.
