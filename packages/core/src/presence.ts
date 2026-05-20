import { Client } from '@xhayper/discord-rpc'
import { VERBS } from './verbs.js'
import { CLAWDS } from './clawds.js'

/**
 * High-level lifecycle state of the presence, emitted via the
 * `onStateChange` callback. Useful for driving a status-bar UI.
 *
 * - `connecting` — attempting to reach the Discord IPC socket.
 * - `connected`  — RPC ready, activity loop running.
 * - `idle`       — Discord is closed (or RPC dropped); polling for it to reappear.
 * - `stopped`    — `stop()` was called; will not reconnect until `start()`.
 */
export type PresenceState = 'connecting' | 'connected' | 'idle' | 'stopped'

export interface PresenceOptions {
  /** Discord Application ID (Client ID). */
  clientId: string
  /** ms between dot frames. Defaults to 10000. Discord rate limit is ~5/20s. */
  frameMs?: number
  /** Number of dot frames per verb (1, 2, 3 dots). Defaults to 3. */
  dotFrames?: number
  /** ms between reconnect attempts while Discord is closed. Defaults to 15000. */
  reconnectMs?: number
  /** Whitelisted verbs (overrides defaults). */
  verbs?: readonly string[]
  /** Whitelisted Clawd keys (overrides defaults). */
  clawds?: readonly string[]
  /** State text shown below the verb. Defaults to "with Claude". */
  stateText?: string
  /** Tooltip for the large image. Defaults to "Clawd". */
  largeImageText?: string
  /** Button label. Defaults to `null` (no button). Set a string to show one. */
  buttonLabel?: string | null
  /** Button URL. Only used when buttonLabel is set. */
  buttonUrl?: string
  /** Logger. Defaults to console.log with timestamp prefix. */
  log?: (msg: string) => void
  /** Called whenever the lifecycle state changes. Useful for status-bar UIs. */
  onStateChange?: (state: PresenceState) => void
}

/**
 * Manages a Clauding-style Discord Rich Presence: connects via IPC, rotates
 * a spinner verb with animated dots, and cycles through a pool of Clawd
 * images. Auto-reconnects when Discord opens/closes.
 *
 * Use start() to begin, stop() to clean up. Safe to call stop() multiple
 * times.
 */
export class ClaudingPresence {
  private readonly clientId: string
  private readonly frameMs: number
  private readonly dotFrames: number
  private readonly reconnectMs: number
  private readonly verbs: readonly string[]
  private readonly clawds: readonly string[]
  private readonly stateText: string
  private readonly largeImageText: string
  private readonly buttonLabel: string | null
  private readonly buttonUrl: string
  private readonly log: (msg: string) => void
  private readonly onStateChange: (state: PresenceState) => void

  private state: PresenceState = 'stopped'
  private client: Client | null = null
  private activityTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private connected = false
  private stopped = false
  private startedAt = Date.now()
  private currentVerb: string | null = null
  private currentClawd: string | null = null
  private dotIndex = 0
  private lastVerb: string | null = null
  private lastClawd: string | null = null

  constructor(opts: PresenceOptions) {
    if (!opts.clientId) throw new Error('clientId is required')
    this.clientId = opts.clientId
    this.frameMs = opts.frameMs ?? 10_000
    this.dotFrames = opts.dotFrames ?? 3
    this.reconnectMs = opts.reconnectMs ?? 15_000
    this.verbs = opts.verbs ?? VERBS
    this.clawds = opts.clawds ?? CLAWDS
    this.stateText = opts.stateText ?? 'with Claude'
    this.largeImageText = opts.largeImageText ?? 'Clawd'
    this.buttonLabel = opts.buttonLabel ?? null
    this.buttonUrl = opts.buttonUrl ?? 'https://claude.com'
    this.log = opts.log ?? ((m) => console.log(`[${new Date().toLocaleTimeString()}] ${m}`))
    this.onStateChange = opts.onStateChange ?? (() => {})
  }

  getState(): PresenceState {
    return this.state
  }

  private setState(state: PresenceState): void {
    if (this.state === state) return
    this.state = state
    try {
      this.onStateChange(state)
    } catch (err) {
      this.log(`onStateChange threw: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  async start(): Promise<void> {
    this.stopped = false
    await this.connect()
  }

  async stop(): Promise<void> {
    this.stopped = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopActivity()
    await this.cleanupClient()
    this.setState('stopped')
  }

  private pickVerb(): string {
    let v: string
    do {
      v = this.verbs[Math.floor(Math.random() * this.verbs.length)]
    } while (v === this.lastVerb && this.verbs.length > 1)
    this.lastVerb = v
    return v
  }

  private pickClawd(): string {
    let c: string
    do {
      c = this.clawds[Math.floor(Math.random() * this.clawds.length)]
    } while (c === this.lastClawd && this.clawds.length > 1)
    this.lastClawd = c
    return c
  }

  private startActivity(): void {
    this.startedAt = Date.now()
    this.currentVerb = this.pickVerb()
    this.currentClawd = this.pickClawd()
    this.dotIndex = 0

    const tick = () => {
      const dots = '.'.repeat(this.dotIndex + 1)
      const buttons = this.buttonLabel
        ? [{ label: this.buttonLabel, url: this.buttonUrl }]
        : undefined

      this.client?.user
        ?.setActivity({
          details: `${this.currentVerb}${dots}`,
          state: this.stateText,
          largeImageKey: this.currentClawd ?? undefined,
          largeImageText: this.largeImageText,
          startTimestamp: this.startedAt,
          buttons,
        })
        .catch((err: Error) => {
          this.log(`setActivity failed: ${err.message}`)
          this.handleDisconnect()
        })

      this.dotIndex++
      if (this.dotIndex >= this.dotFrames) {
        this.dotIndex = 0
        this.currentVerb = this.pickVerb()
        this.currentClawd = this.pickClawd()
      }
    }

    tick()
    this.activityTimer = setInterval(tick, this.frameMs)
  }

  private stopActivity(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }
  }

  private handleDisconnect = (): void => {
    if (!this.connected) return
    this.connected = false
    this.log('Discord disconnected. Going idle…')
    this.stopActivity()
    void this.cleanupClient()
    if (!this.stopped) {
      this.setState('idle')
      this.scheduleReconnect()
    }
  }

  private async cleanupClient(): Promise<void> {
    if (!this.client) return
    try {
      await this.client.destroy()
    } catch {
      /* ignore */
    }
    this.client = null
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.stopped) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, this.reconnectMs)
  }

  private async connect(): Promise<void> {
    if (this.stopped) return
    await this.cleanupClient()
    this.setState('connecting')
    const client = new Client({ clientId: this.clientId })
    this.client = client

    client.on('ready', () => {
      this.connected = true
      this.log(`Connected as ${client.user?.username ?? '<unknown>'}`)
      this.setState('connected')
      this.startActivity()
    })
    client.on('disconnected', this.handleDisconnect)
    client.on('close', this.handleDisconnect)
    client.on('error', (err: Error) => this.log(`client error: ${err?.message ?? err}`))

    try {
      await client.login()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      this.log(`Discord not available (${msg}). Retrying in ${this.reconnectMs / 1000}s.`)
      await this.cleanupClient()
      this.setState('idle')
      this.scheduleReconnect()
    }
  }
}
