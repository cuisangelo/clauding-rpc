#!/usr/bin/env node
import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ClaudingPresence } from '@clauding/core'

// Resolve .env from the project root regardless of CWD.
// dist/index.js → packages/daemon/dist → packages/daemon → packages → root
const here = dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: join(here, '..', '..', '..', '.env'), quiet: true })

const clientId = process.env.DISCORD_CLIENT_ID
if (!clientId) {
  console.error('Missing DISCORD_CLIENT_ID. Copy .env.example to .env and fill it in.')
  process.exit(1)
}

const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`)

const presence = new ClaudingPresence({ clientId, log })

const shutdown = async (signal: string) => {
  log(`Received ${signal}. Shutting down…`)
  await presence.stop()
  process.exit(0)
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

log('Starting Clauding daemon…')
void presence.start()
