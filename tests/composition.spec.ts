import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import Include from '@deepseek-ai/cordis-plugin-include'
import BrowserUse from '@deepseek-ai/dsh-browser-use'
import ComputerUse from '@deepseek-ai/dsh-computer-use'
import { BrowserUseProviderName } from '@deepseek-ai/dsh-browser-use/brand'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@deepseek-ai/dsh-agent-loop-testkit'
import type { DesktopBrowserRequest } from '../src/contracts/desktop.ts'
import { catalog, fixture, resetFixture } from './computer/fixtures/cua-driver.ts'
import * as Bundle from '../src/index.ts'

vi.mock('@trycua/cua-driver', async () => import('./computer/fixtures/cua-driver.ts'))

let ctx: Context
const directories: string[] = []
const hostManagedTools = ['page', 'set_config', 'install_ffmpeg', 'replay_trajectory',
  'start_session', 'escalate_session', 'get_session', 'list_sessions', 'get_session_state', 'end_session',
  'start_recording', 'stop_recording', 'get_recording_state']
beforeEach(async () => {
  resetFixture()
  ctx = new Context()
  await ctx.plugin(BrowserUse)
  await ctx.plugin(ComputerUse)
  await mountAgentLoopTestDependencies(ctx)
  ctx.provide('browserInteraction', { register: () => () => {} })
  ctx.provide('computerAuthorization', { request: async () => 'deny', revoke: async () => {} })
})
afterEach(async () => {
  await ctx.fiber.dispose()
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

it('loads the independent entry through Loader, forwards exact session ownership, and fully unloads', async () => {
  fixture.list = async () => JSON.stringify({ tools: [...catalog.tools,
    { name: 'browser_click', inputSchema: { type: 'object' } },
    ...hostManagedTools.map(name => ({ name, inputSchema: { type: 'object' } })),
  ] })
  const request = vi.fn(async (_input: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Synthetic page' }))
  ctx.provide('desktopBrowser', { request })
  const harness = await mountAgentLoopTestHarness(ctx)
  const agent = await harness.create(SessionId('bundle-owner'))
  const root = await mkdtemp(join(tmpdir(), 'dsh-computer-browser-loader-'))
  directories.push(root)
  const path = join(root, 'cordis.yml')
  await writeFile(path, JSON.stringify([{ id: 'bundle', name: '@missher/dsh-computer-browser' }]))
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  ctx.loader.internal = {
    version: 'v2', async import(specifier: string) {
      if (specifier === '@missher/dsh-computer-browser') return Bundle
      throw new Error(`Unexpected module ${specifier}`)
    },
    loadCache: new Map(),
    register(): never { throw new Error('Unexpected module hook registration') },
    getOrCreateModuleJob(): never { throw new Error('Unexpected module job creation') },
    resolveSync(): never { throw new Error('Unexpected synchronous module resolution') },
    load(): never { throw new Error('Unexpected module load') },
  }
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(path).href } })
  await ctx.loader.await()
  expect(ctx.browserUse.providerName).toBe('electron-sidebar')
  expect(ctx.computerUse.providerName).toBe('cua-driver-native')
  const names = ctx.tools.schemas().map(tool => tool.name)
  expect(names).toContain('browser_use')
  expect(names.some(name => name.startsWith('cua_driver_native__'))).toBe(true)
  expect(names.some(name => name.startsWith('cua_driver_native__') && /(^|_)browser(_|$)/u.test(name))).toBe(false)
  for (const name of hostManagedTools) expect(names).not.toContain(`cua_driver_native__${name}`)
  const result = await ctx.tools.execute({
    agent, name: 'browser_use', callId: ToolCallId('bundle-observe'), arguments: { action: 'list' }, signal: new AbortController().signal,
  })
  expect(result.isError).toBe(false)
  expect(request.mock.calls[0]?.[0]).toMatchObject({ owner: { sessionId: 'bundle-owner' }, operation: { action: 'list' } })
  const fiber = [...ctx.loader.entries()].find(entry => entry.options.id === 'bundle')!.fiber!
  await fiber.dispose()
  expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ operation: { action: 'release' } }), expect.any(AbortSignal))
  expect(ctx.tools.schemas()).toEqual([])
  expect(ctx.browserUse.providerName).toBeUndefined()
  expect(ctx.computerUse.providerName).toBeUndefined()
  expect(fixture.shutdowns).toBe(1)
  expect(fixture.destroys).toBe(1)
})

it('clearly refuses missing Electron bridge before creating a native runtime', async () => {
  await expect(ctx.plugin(Bundle)).rejects.toThrow('automationVersion 1')
  expect(fixture.creates).toBe(0)
  expect(ctx.browserUse.providerName).toBeUndefined()
})

it('rolls back browser tools if native startup fails', async () => {
  ctx.provide('desktopBrowser', { request: vi.fn() })
  fixture.createError = new Error('Synthetic native initialization failure')
  await expect(ctx.plugin(Bundle)).rejects.toThrow('Synthetic native initialization failure')
  expect(ctx.tools.schemas()).toEqual([])
  expect(ctx.browserUse.providerName).toBeUndefined()
  expect(ctx.computerUse.providerName).toBeUndefined()
})

it('refuses a competing browser provider without replacing its registration', async () => {
  ctx.provide('desktopBrowser', { request: vi.fn() })
  const release = ctx.browserUse.register(BrowserUseProviderName('existing'))
  await expect(ctx.plugin(Bundle)).rejects.toThrow('already registered')
  expect(ctx.browserUse.providerName).toBe('existing')
  expect(fixture.creates).toBe(0)
  await release()
})

it('exposes only a visible isolated Playwright alternative and sane authority bounds', async () => {
  expect(Bundle.Config({})).toMatchObject({ backend: 'electron', sessionTtlSeconds: 3600, idleTtlSeconds: 600 })
  expect(() => Bundle.Config({ backend: 'attach' } as never)).toThrow()
  await expect(ctx.plugin(Bundle, { backend: 'playwright', idleTtlSeconds: 2, sessionTtlSeconds: 1 })).rejects.toThrow('TTL')
  const fibers: Fiber[] = []
  ctx.on('internal/plugin', fiber => { if (fiber.uid !== null) fibers.push(fiber) }, { global: true })
  const bundle = ctx.plugin(Bundle, { backend: 'playwright', executablePath: '/fixture/chromium', toolCallTimeoutMs: 1234 })
  await bundle
  expect(ctx.browserUse.providerName).toBe('playwright-mcp')
  const browser = fibers.find(fiber => fiber.runtime?.name === 'experimental-browser-use-playwright-mcp')
  expect(browser?.config).toEqual({ mode: 'launch', headless: false, executablePath: '/fixture/chromium', toolCallTimeoutMs: 1234 })
  expect(fibers.find(fiber => fiber.runtime?.name === 'experimental-computer-use-cua-driver-native')?.config.browserTools).toBe(false)
  await bundle.dispose()
  expect(ctx.browserUse.providerName).toBeUndefined()
})

it.each(['browserInteraction', 'computerAuthorization'] as const)('rejects missing trusted %s on both backends before loading providers', async missing => {
  const isolated = new Context()
  try {
    await isolated.plugin(BrowserUse)
    await isolated.plugin(ComputerUse)
    await mountAgentLoopTestDependencies(isolated)
    isolated.provide('desktopBrowser', { request: vi.fn() })
    if (missing !== 'browserInteraction') isolated.provide('browserInteraction', { register: () => () => {} })
    if (missing !== 'computerAuthorization') isolated.provide('computerAuthorization', { request: async () => 'deny', revoke: async () => {} })
    for (const backend of ['electron', 'playwright'] as const) {
      await expect(isolated.plugin(Bundle, { backend })).rejects.toThrow('browserInteraction and computerAuthorization')
      expect(isolated.browserUse.providerName).toBeUndefined()
      expect(isolated.computerUse.providerName).toBeUndefined()
      expect(fixture.creates).toBe(0)
    }
  } finally {
    await isolated.fiber.dispose()
  }
})

it('keeps every Host runtime implementation external in the candidate artifact', async () => {
  const report = JSON.parse(await readFile(new URL('../verification/build.json', import.meta.url), 'utf8'))
  expect(report.inputs.every((input: { path: string }) => input.path.startsWith('src/'))).toBe(true)
  expect(report.imports.filter((item: { path: string }) => item.path.startsWith('@deepseek-ai/dsh-')).every((item: { external: boolean }) => item.external)).toBe(true)
  expect(report.imports.some((item: { path: string }) => item.path === '@deepseek-ai/dsh-mcp-client')).toBe(true)
})
