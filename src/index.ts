/** One independently removable Bundle for native Computer Use and one browser backend. */
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import * as ElectronBrowser from './browser/electron.ts'
import * as PlaywrightBrowser from './browser/playwright.ts'
import * as NativeComputer from './computer/index.ts'
import type {} from './contracts/desktop.ts'

export const name = 'missher-computer-browser'
export const inject = ['browserUse', 'computerUse', 'tools', 'agents', 'systemPrompt']

export interface Config {
  backend: 'electron' | 'playwright'
  executablePath?: string
  toolCallTimeoutMs?: number
  sessionTtlSeconds: number
  idleTtlSeconds: number
}

export const Config: Schema<Partial<Config>, Config> = Schema.object({
  backend: Schema.union(['electron', 'playwright']).default('electron').description('Browser backend: visible Desktop Sidebar or isolated Playwright window.'),
  executablePath: Schema.string().pattern(/\S/u).description('Optional Chromium executable for the Playwright backend.'),
  toolCallTimeoutMs: Schema.number().min(1).description('Optional Playwright MCP call timeout in milliseconds.'),
  sessionTtlSeconds: Schema.number().min(1).max(86_400).step(1).default(3600),
  idleTtlSeconds: Schema.number().min(1).max(86_400).step(1).default(600),
})

/** A failed component rolls back its sibling; the parent fiber owns normal teardown. */
export async function apply(ctx: Context, config: Config): Promise<void> {
  if (config.backend === 'electron' && typeof ctx.get('desktopBrowser')?.request !== 'function') {
    throw new Error('Electron browser control requires the matching Missher Desktop integration (browser automationVersion 1). Official rc.2 does not provide this bridge.')
  }
  const interaction = ctx.get('browserInteraction')
  const authorization = ctx.get('computerAuthorization')
  // These services are installed by the trusted Desktop bootstrap before plugins
  // mount. Checking them does not grant authority or create a replacement Host.
  if (typeof interaction?.register !== 'function'
    || typeof authorization?.request !== 'function'
    || typeof authorization?.revoke !== 'function') {
    throw new Error('Computer Browser Use requires a compatible Missher Desktop Host with browserInteraction and computerAuthorization. Official rc.2 does not provide these trusted controls.')
  }
  if (config.idleTtlSeconds > config.sessionTtlSeconds) throw new Error('Native idle TTL must not exceed session TTL')
  const browser = config.backend === 'electron'
    ? ctx.plugin(ElectronBrowser)
    : ctx.plugin(PlaywrightBrowser, {
      mode: 'launch', headless: false,
      ...(config.executablePath === undefined ? {} : { executablePath: config.executablePath }),
      ...(config.toolCallTimeoutMs === undefined ? {} : { toolCallTimeoutMs: config.toolCallTimeoutMs }),
    })
  let native: ReturnType<Context['plugin']> | undefined
  try {
    await browser
    native = ctx.plugin(NativeComputer, {
      browserTools: false, sessionTtlSeconds: config.sessionTtlSeconds, idleTtlSeconds: config.idleTtlSeconds,
    })
    await native
  } catch (error) {
    await native?.dispose()
    await browser.dispose()
    throw error
  }
}
