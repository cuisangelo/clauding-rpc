import * as vscode from 'vscode'
import { ClaudingPresence, type PresenceOptions, type PresenceState } from '@clauding/core'

const ENABLED_KEY = 'clauding.enabled'
const TOGGLE_COMMAND = 'clauding.toggle'

let presence: ClaudingPresence | null = null
let output: vscode.OutputChannel | null = null
let statusBar: vscode.StatusBarItem | null = null

function getOutput(): vscode.OutputChannel {
  if (!output) output = vscode.window.createOutputChannel('Clauding')
  return output
}

function log(msg: string): void {
  getOutput().appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

function getEnabled(context: vscode.ExtensionContext): boolean {
  return context.globalState.get<boolean>(ENABLED_KEY, true)
}

async function setEnabled(context: vscode.ExtensionContext, value: boolean): Promise<void> {
  await context.globalState.update(ENABLED_KEY, value)
}

function readOptions(): PresenceOptions | null {
  const cfg = vscode.workspace.getConfiguration('clauding')
  const clientId = cfg.get<string>('discordClientId', '').trim()
  if (!clientId) return null

  const buttonLabel = cfg.get<string>('buttonLabel', '').trim()
  return {
    clientId,
    frameMs: cfg.get<number>('frameMs', 10_000),
    dotFrames: cfg.get<number>('dotFrames', 3),
    stateText: cfg.get<string>('stateText', 'with Claude'),
    buttonLabel: buttonLabel.length > 0 ? buttonLabel : null,
    buttonUrl: cfg.get<string>('buttonUrl', 'https://claude.com'),
    log,
  }
}

type DisplayState = PresenceState | 'disabled' | 'unconfigured'

function updateStatusBar(state: DisplayState): void {
  if (!statusBar) return
  const warningBg = new vscode.ThemeColor('statusBarItem.warningBackground')
  switch (state) {
    case 'connected':
      statusBar.text = '$(zap) Clauding'
      statusBar.tooltip = 'Clauding is active. Click to pause.'
      statusBar.backgroundColor = undefined
      break
    case 'connecting':
      statusBar.text = '$(sync~spin) Clauding'
      statusBar.tooltip = 'Clauding is connecting to Discord… Click to pause.'
      statusBar.backgroundColor = undefined
      break
    case 'idle':
      statusBar.text = '$(sync~spin) Clauding'
      statusBar.tooltip = 'Waiting for Discord to open. Click to pause.'
      statusBar.backgroundColor = undefined
      break
    case 'stopped':
    case 'disabled':
      statusBar.text = '$(circle-slash) Clauding'
      statusBar.tooltip = 'Clauding is paused. Click to enable.'
      statusBar.backgroundColor = warningBg
      break
    case 'unconfigured':
      statusBar.text = '$(warning) Clauding'
      statusBar.tooltip = 'Clauding needs a Discord Application ID. Click to open settings.'
      statusBar.backgroundColor = warningBg
      break
  }
}

async function startPresence(context: vscode.ExtensionContext): Promise<void> {
  await stopPresence()

  if (!getEnabled(context)) {
    updateStatusBar('disabled')
    return
  }

  const opts = readOptions()
  if (!opts) {
    updateStatusBar('unconfigured')
    return
  }

  updateStatusBar('connecting')

  presence = new ClaudingPresence({
    ...opts,
    onStateChange: (state) => {
      log(`state → ${state}`)
      // If the user disabled while presence was alive, don't override the disabled UI.
      if (!getEnabled(context)) {
        updateStatusBar('disabled')
        return
      }
      updateStatusBar(state)
    },
  })
  await presence.start()
}

async function stopPresence(): Promise<void> {
  if (!presence) return
  await presence.stop()
  presence = null
}

async function togglePresence(context: vscode.ExtensionContext): Promise<void> {
  const wasEnabled = getEnabled(context)

  if (wasEnabled) {
    await setEnabled(context, false)
    await stopPresence()
    updateStatusBar('disabled')
    log('Disabled by user.')
  } else {
    await setEnabled(context, true)
    log('Enabled by user.')
    // If the user clicked while in the "unconfigured" state, open settings.
    if (!readOptions()) {
      updateStatusBar('unconfigured')
      void vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'clauding.discordClientId',
      )
      return
    }
    await startPresence(context)
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log('Activating Clauding extension')

  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.command = TOGGLE_COMMAND
  statusBar.text = '$(sync~spin) Clauding'
  statusBar.tooltip = 'Clauding is starting…'
  statusBar.show()

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand(TOGGLE_COMMAND, () => togglePresence(context)),
    vscode.commands.registerCommand('clauding.restart', async () => {
      log('Restart command invoked')
      await setEnabled(context, true)
      await startPresence(context)
    }),
    vscode.commands.registerCommand('clauding.stop', async () => {
      log('Stop command invoked')
      await setEnabled(context, false)
      await stopPresence()
      updateStatusBar('disabled')
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('clauding')) {
        log('Config changed — restarting presence')
        void startPresence(context)
      }
    }),
    {
      dispose: () => {
        void stopPresence()
        output?.dispose()
        output = null
        statusBar = null
      },
    },
  )

  await startPresence(context)
}

export async function deactivate(): Promise<void> {
  await stopPresence()
}
