import 'dotenv/config'
import { Client } from '@xhayper/discord-rpc'
import { VERBS } from './verbs.js'

const CLIENT_ID = process.env.DISCORD_CLIENT_ID
if (!CLIENT_ID) {
  console.error('Missing DISCORD_CLIENT_ID. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

const FRAME_MS = 10_000          // 10s per dot frame → 30s per verb
const DOT_FRAMES = 3             // 1, 2, 3 dots
const RECONNECT_MS = 15_000      // poll for Discord every 15s when disconnected

const ts = () => new Date().toLocaleTimeString()
const log = (msg) => console.log(`[${ts()}] ${msg}`)

// Discord asset keys — must match what's uploaded under
// Discord Developer Portal → Rich Presence → Art Assets.
const CLAWDS = [
  'clawd',
  'clawd-book',
  'clawd-bubble',
  'clawd-cape',
  'clawd-coffee',
  'clawd-dizzy',
  'clawd-happy',
  'clawd-headphones',
  'clawd-heart',
  'clawd-kite',
  'clawd-lightbulb',
  'clawd-magnifier',
  'clawd-skateboard',
  'clawd-wand',
]

let lastVerb = null
function pickVerb() {
  let v
  do { v = VERBS[Math.floor(Math.random() * VERBS.length)] } while (v === lastVerb)
  lastVerb = v
  return v
}

let lastClawd = null
function pickClawd() {
  let c
  do { c = CLAWDS[Math.floor(Math.random() * CLAWDS.length)] } while (c === lastClawd)
  lastClawd = c
  return c
}

let client = null
let activityTimer = null
let reconnectTimer = null
let connected = false
let startedAt = Date.now()
let currentVerb = null
let currentClawd = null
let dotIndex = 0

function startActivity() {
  startedAt = Date.now()
  currentVerb = pickVerb()
  currentClawd = pickClawd()
  dotIndex = 0

  const tick = () => {
    const dots = '.'.repeat(dotIndex + 1)
    client?.user?.setActivity({
      details: `${currentVerb}${dots}`,
      state: 'with Claude',
      largeImageKey: currentClawd,
      largeImageText: 'Clawd',
      startTimestamp: startedAt,
      buttons: [{ label: 'claude.com', url: 'https://claude.com' }],
    }).catch(err => {
      log(`setActivity failed: ${err.message}`)
      handleDisconnect()
    })

    dotIndex++
    if (dotIndex >= DOT_FRAMES) {
      dotIndex = 0
      currentVerb = pickVerb()
      currentClawd = pickClawd()
    }
  }

  tick()
  activityTimer = setInterval(tick, FRAME_MS)
}

function stopActivity() {
  if (activityTimer) {
    clearInterval(activityTimer)
    activityTimer = null
  }
}

function handleDisconnect() {
  if (!connected) return
  connected = false
  log('Discord disconnected. Going idle…')
  stopActivity()
  cleanupClient()
  scheduleReconnect()
}

async function cleanupClient() {
  if (!client) return
  try { await client.destroy() } catch {}
  client = null
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, RECONNECT_MS)
}

async function connect() {
  await cleanupClient()
  client = new Client({ clientId: CLIENT_ID })

  client.on('ready', () => {
    connected = true
    log(`Connected as ${client.user?.username}`)
    startActivity()
  })

  client.on('disconnected', handleDisconnect)
  client.on('close', handleDisconnect)
  client.on('error', (err) => log(`client error: ${err?.message ?? err}`))

  try {
    await client.login()
  } catch (err) {
    log(`Discord not available (${err.message}). Retrying in ${RECONNECT_MS / 1000}s.`)
    await cleanupClient()
    scheduleReconnect()
  }
}

const shutdown = async () => {
  log('Shutting down…')
  if (reconnectTimer) clearTimeout(reconnectTimer)
  stopActivity()
  await cleanupClient()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

log('Starting Clauding presence…')
connect()
