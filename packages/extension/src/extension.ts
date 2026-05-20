import * as vscode from 'vscode'
import { ClaudingPresence, type PresenceOptions } from '@clauding/core'

let presence: ClaudingPresence | null = null
let output: vscode.OutputChannel | null = null

function getOutput(): vscode.OutputChannel {
  if (!output) output = vscode.window.createOutputChannel('Clauding')
  return output
}

function log(msg: string): void {
  getOutput().appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`)
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

async function startPresence(): Promise<void> {
  await stopPresence()

  const opts = readOptions()
  if (!opts) {
    vscode.window
      .showWarningMessage(
        'Clauding: set "clauding.discordClientId" in your settings to enable Rich Presence.',
        'Open Settings',
      )
      .then((choice) => {
        if (choice === 'Open Settings') {
          void vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'clauding.discordClientId',
          )
        }
      })
    return
  }

  presence = new ClaudingPresence(opts)
  await presence.start()
}

async function stopPresence(): Promise<void> {
  if (!presence) return
  await presence.stop()
  presence = null
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  log('Activating Clauding extension')

  context.subscriptions.push(
    vscode.commands.registerCommand('clauding.restart', async () => {
      log('Restart command invoked')
      await startPresence()
    }),
    vscode.commands.registerCommand('clauding.stop', async () => {
      log('Stop command invoked')
      await stopPresence()
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('clauding')) {
        log('Config changed — restarting presence')
        void startPresence()
      }
    }),
    {
      dispose: () => {
        void stopPresence()
        output?.dispose()
        output = null
      },
    },
  )

  await startPresence()
}

export async function deactivate(): Promise<void> {
  await stopPresence()
}
