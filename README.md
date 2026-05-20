# Clauding

> Discord Rich Presence personal que muestra a Claude trabajando — con verbos rotando estilo Claude Code y a **Clawd** (la mascota oficial de Claude Code) cambiando cada 30 segundos.

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
- **14 Clawds** procesados desde los [stickers oficiales de Stickermule](https://www.stickermule.com/claudecode) — sin fondo, sin borde de sticker, sin pixels blancos sueltos, 1024 × 1024 PNG transparente.
- **Animación de dots**: cada 10 s el spinner crece `Verbo.` → `Verbo..` → `Verbo...`
- **Cambio de verbo + Clawd**: cada 30 s, sin repetir el anterior.
- **Auto-reconnect**: detecta cuando Discord abre o cierra; cuando está cerrado pasa a idle (≈ 0 % CPU) y reconecta solo al volver.
- **Bundle macOS opcional**: aparece como **"Clauding"** con el ícono de Claude en *Login Items*, no como `node` con ícono genérico.

---

## 📋 Requisitos

- macOS (probado en Apple Silicon)
- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io)
- Cliente de **Discord desktop** corriendo (la web/PWA no expone IPC)
- Cuenta de Discord Developer (gratis) para crear la Application

---

## 🚀 Setup

### 1. Clonar e instalar

```bash
git clone https://github.com/cuisangelo/discord-rich-presence.git
cd discord-rich-presence
pnpm install
```

### 2. Crear la Discord Application

1. Abrí <https://discord.com/developers/applications>
2. **New Application** → nombre: `Clauding` (Discord bloquea "Claude" por marca, "Clauding" funciona y juega con los gerundios)
3. Aceptar los ToS y crear
4. Copiá el **Application ID** de la pestaña *General Information*
5. (Opcional) Subí un icono para que el header diga **"Playing Clauding"** con tu logo

### 3. Subir los assets a Discord

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

> ⚠️ Discord cachea los assets: tardan **5–10 minutos** en propagarse después de subir. Antes de eso vas a ver imagen rota en la presence.
>
> ⚠️ Las keys **no se pueden editar** una vez guardadas. Si te equivocás, hay que eliminar y resubir.

### 4. Configurar el `.env`

```bash
cp .env.example .env
# editá .env y pegá tu Application ID:
# DISCORD_CLIENT_ID=123456789012345678
```

### 5. Probar

```bash
pnpm start
```

Con Discord desktop abierto deberías ver `Connected as <tu_username>` y la presence en tu perfil al instante.

### 6. (Opcional) Autostart en macOS

Para que arranque solo en cada login y desaparezca/idle solo cuando Discord se cierra:

```bash
cp launchd/com.claude.presence.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/com.claude.presence.plist
```

Para verlo bonito en *System Settings → General → Login Items* (como **Clauding** con ícono de Claude en vez de `node`):

```bash
# Firma el binario interno con el ícono de Claude
swift -e 'import AppKit;
  let icon = NSImage(contentsOfFile: "Clauding.app/Contents/Resources/icon.icns")!;
  _ = NSWorkspace.shared.setIcon(icon, forFile: "Clauding.app/Contents/MacOS/Clauding", options: [])'
```

Comandos útiles:

```bash
# Ver logs en vivo
tail -f launchd.out.log

# Pausar
launchctl unload ~/Library/LaunchAgents/com.claude.presence.plist

# Reanudar
launchctl load ~/Library/LaunchAgents/com.claude.presence.plist
```

> ℹ️ Si estás en Linux usá un service de systemd y si estás en Windows un Task Scheduler — el `src/index.js` es portable, solo el wrapper de autostart cambia.

---

## 🛠 Cómo funciona

```
src/index.js
├── conecta vía IPC a Discord usando @xhayper/discord-rpc
├── selecciona verbo aleatorio (sin repetir el anterior)
├── selecciona Clawd aleatorio (sin repetir el anterior)
├── cada 10 s: aumenta los dots y manda setActivity()
├── cada 30 s (3 frames): cambia verbo + Clawd
└── escucha events 'disconnected' / 'close' / setActivity-failure:
    → para el timer, hace cleanup
    → poll cada 15 s para detectar Discord de vuelta
```

### Rate limit de Discord

Discord RPC permite ~5 updates / 20 s. Por eso los frames son cada 10 s — bajo del límite con margen, y deja tiempo a que la presence propague visualmente.

---

## 🎨 Personalización

### Cambiar los verbos

Editá `src/verbs.js`. La lista actual viene del [collection de Wynand](https://github.com/wynandw87/claude-code-spinner-verbs); incluye los 185 defaults oficiales de Claude Code + ~1 757 themed (Vibe Check, Godzilla, Harry Potter, 1960s Hippie, etc.).

### Agregar nuevos Clawds

1. Conseguí el PNG nuevo y dejalo en `assets/stickers/originals/`
2. Procesalo:
   ```bash
   python3 scripts/process_stickers.py
   ```
3. El output queda en `assets/stickers/processed/`
4. Subilo a Discord Developer Portal con una key (sin extensión, ej. `clawd-mynew`)
5. Agregalo al array `CLAWDS` en `src/index.js`
6. Reiniciá:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.claude.presence.plist
   launchctl load -w ~/Library/LaunchAgents/com.claude.presence.plist
   ```

### Ajustar tiempos

En `src/index.js`:

```js
const FRAME_MS = 10_000      // ms entre dots; mínimo seguro ≈ 5 000
const DOT_FRAMES = 3         // dots por verbo (1, 2, 3)
const RECONNECT_MS = 15_000  // poll de reconexión cuando Discord está cerrado
```

---

## 🔧 Pipeline de procesamiento de stickers

`scripts/process_stickers.py` (requiere `Pillow`):

1. **Flood-fill desde el perímetro** por píxeles blancos *o* transparentes — limpia el fondo + borde blanco del sticker en una pasada.
2. **Crop al bounding box** del contenido visible.
3. **Upscale con NEAREST** si la imagen es < 300 px (preserva la estética pixel-art crujiente).
4. **Padding** a cuadrado con 5 % de margen + resize a 1024 × 1024 con LANCZOS.
5. **Alpha-threshold**: pixels con α < 128 → 0, ≥ 128 → 255. Mata el anti-aliasing borroso.
6. **Anti-ringing**: limpia los pixels oscuros con α bajo que LANCZOS deja en bordes contenido↔transparente.
7. **White-killer**: cualquier pixel con RGB ≥ 240 muere. Los Clawds no tienen blanco en el diseño; el blanco es siempre borde de sticker o highlight artificial.

El resultado: PNG 1024×1024 transparente listo para Discord Rich Presence.

---

## 🐛 Troubleshooting

**"Connected as ..." pero no veo nada en mi perfil**
→ Settings → **Activity Privacy** → "Share your detected activities..." tiene que estar ON.

**Veo imagen rota / placeholder en la presence**
→ Los assets recién subidos tardan 5–10 min en propagar en el CDN de Discord. Esperá.

**El verbo no cambia**
→ Discord cachea agresivamente. Cerrá y volvé a abrir tu perfil. Si en logs ves `Connected as ...`, el script está mandando los updates bien.

**Login Items muestra "node" con ícono genérico**
→ Estás apuntando al binario directamente. Usá el bundle `Clauding.app` (ver setup paso 6). Si dice "Clauding" pero sigue con ícono `exec`: toggle off → on en *Login Items*, eso fuerza a `backgroundtaskmanagementd` a soltar la caché.

**iPhone Screen Time muestra `com.claude.presence` con ícono blanco**
→ Limitación de Apple. Screen Time pintea el icono solo cuando hay match exacto de bundle ID en el App Store de iOS. Como Clauding no existe en iOS, no hay manera. Apple ni siquiera lo arregló para su propio `com.apple.Terminal`. Resignate.

---

## 📦 Stack

- [`@xhayper/discord-rpc`](https://github.com/xhayper/discord-rpc) — cliente IPC mantenido del Rich Presence
- [`dotenv`](https://github.com/motdotla/dotenv) — env vars
- Python + [Pillow](https://python-pillow.org) — pipeline de procesamiento
- Swift inline + AppKit — set custom icon en el binario del bundle macOS

---

## 📜 Licencia

MIT. El logo y los stickers de Clawd son propiedad de [Anthropic](https://www.anthropic.com); úsalos solo para uso personal o no comercial.
