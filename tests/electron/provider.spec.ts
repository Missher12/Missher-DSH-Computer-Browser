/** Actual ToolRuntime derives browser authority from each live Agent, never model arguments. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import BrowserUse from '@deepseek-ai/dsh-browser-use'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@deepseek-ai/dsh-agent-loop-testkit'
import { SessionId } from '@deepseek-ai/dsh-session'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { assertObjectJsonSchema, jsonSchemaToTs, validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { DesktopBrowserRequest } from '../../src/contracts/desktop.ts'
import * as Provider from '../../src/browser/electron.ts'
let ctx: Context, agent: Agent
beforeEach(async () => { ctx = new Context(); await ctx.plugin(BrowserUse); await mountAgentLoopTestDependencies(ctx); const harness = await mountAgentLoopTestHarness(ctx); agent = await harness.create(SessionId('electron-owner')) })
afterEach(async () => { await ctx.fiber.dispose() })
const execute = (arguments_: Record<string, unknown>) => ctx.tools.execute({ agent, name: 'browser_use', callId: ToolCallId('browser-test'), arguments: arguments_, signal: new AbortController().signal })
describe('Electron browser provider', () => {
  it('advertises an object root accepted by function-call providers and documents conditional fields', async () => {
    await ctx.plugin(Provider)
    const parameters = ctx.tools.schemas(agent).find(tool => tool.name === 'browser_use')!.parameters
    assertObjectJsonSchema(parameters)
    expect(parameters.type).toBe('object')
    expect(parameters).not.toHaveProperty('oneOf')
    expect(parameters.properties?.action?.description).toContain('open(url)')
    expect(parameters.properties?.action?.description).toContain('navigate(target, url)')
    expect(validateJsonSchemaValue(parameters, { action: 'release' })).not.toEqual([])
    expect(validateJsonSchemaValue(parameters, { action: 'open', url: 12 })).not.toEqual([])
    expect(validateJsonSchemaValue(parameters, { action: 'open', url: 'https://example.test/' })).toEqual([])
    expect(validateJsonSchemaValue(parameters, { action: 'navigate', target: 'owned', url: 'https://example.test/' })).toEqual([])
    expect(validateJsonSchemaValue(parameters, { action: 'list' })).toEqual([])
    expect(validateJsonSchemaValue(parameters, { action: 'fill', target: 'owned', snapshot: 'snapshot', element: 'field', text: '' })).toEqual([])
    expect(jsonSchemaToTs(parameters)).toContain('url?: string')
  })

  it.each([
    { action: 'observe' }, { action: 'screenshot' },
    { action: 'click', target: 'owned', snapshot: 'fresh' },
    { action: 'fill', target: 'owned', snapshot: 'fresh', element: 'field' },
    { action: 'press', target: 'owned', key: 'Enter' },
    { action: 'scroll', target: 'owned', delta: 100 },
    { action: 'wait', target: 'owned', text: 'ready' },
    { action: 'upload', target: 'owned', snapshot: 'fresh' },
    { action: 'close' }, { action: 'list', url: 'https://example.test/' },
  ])('rejects invalid action fields before activation or IPC: %j', async arguments_ => {
    const request = vi.fn(async (_value: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Unexpected bridge call' }))
    ctx.provide('desktopBrowser', { request })
    const fiber = ctx.plugin(Provider)
    await fiber
    const result = await execute(arguments_)
    expect(result.isError).toBe(true)
    expect(JSON.stringify(result.content)).toContain('Invalid browser_use')
    await fiber.dispose()
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['open', 'navigate'])('rejects invalid %s URLs before IPC or activation ownership', async action => {
    const request = vi.fn(async (_value: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Unexpected bridge call' }))
    ctx.provide('desktopBrowser', { request })
    const fiber = ctx.plugin(Provider)
    await fiber
    const base = { action, ...(action === 'navigate' ? { target: 'owned' } : {}) }
    for (const value of [undefined, null, 12, '', ' \t\n', 'https://example.test/\0', `https://example.test/${'a'.repeat(8192)}`, '/relative', 'file:///tmp/page', 'javascript:alert(1)', 'https://user:secret@example.test/']) {
      const outcome = await execute({ ...base, ...(value === undefined ? {} : { url: value }) })
      expect(outcome.isError).toBe(true)
      expect(JSON.stringify(outcome.content)).toContain(`browser_use ${action} requires \\"url\\"`)
      expect(request).not.toHaveBeenCalled()
    }
    // Minted owners trigger a release during unload. None may exist after only
    // rejected operations, even though an Agent was already alive.
    await fiber.dispose()
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['open', 'navigate'])('passes valid %s URLs unchanged with the live owner', async action => {
    const request = vi.fn(async (_value: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Page ready' }))
    ctx.provide('desktopBrowser', { request })
    await ctx.plugin(Provider)
    const operation = { action, ...(action === 'navigate' ? { target: 'owned' } : {}), url: 'https://example.test/path?q=hello#section' }
    const outcome = await execute(operation)
    expect(outcome.isError).toBe(false)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0]?.[0]).toMatchObject({ owner: { sessionId: agent.id }, operation })
  })

  it('rejects a missing navigation target and unsupported actions without side effects', async () => {
    const request = vi.fn(async (_value: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Unexpected bridge call' }))
    ctx.provide('desktopBrowser', { request })
    const fiber = ctx.plugin(Provider)
    await fiber
    const missingTarget = await execute({ action: 'navigate', url: 'https://example.test/' })
    expect(missingTarget.isError).toBe(true)
    expect(JSON.stringify(missingTarget.content)).toContain('target')
    expect((await execute({ action: 'release' })).isError).toBe(true)
    await fiber.dispose()
    expect(request).not.toHaveBeenCalled()
  })

  it('fails clearly when the Desktop bridge is absent without selecting another backend', async () => {
    await ctx.plugin(Provider)
    const outcome = await execute({ action: 'open', url: 'https://example.test' })
    expect(outcome.isError).toBe(true)
    expect(JSON.stringify(outcome.content)).toContain('matching Missher Desktop integration')
  })
  it('derives the owner and retains canonical tool results before unloading', async () => {
    const request = vi.fn(async (_value: DesktopBrowserRequest) => ({ status: 'observed' as const, message: 'Observed controlled page', data: { text: 'Local fixture' } }))
    ctx.provide('desktopBrowser', { request })
    const fiber = ctx.plugin(Provider); await fiber
    const outcome = await execute({ action: 'list' })
    expect(outcome.isError).toBe(false)
    expect(request.mock.calls[0]?.[0].owner.sessionId).toBe(agent.id)
    expect(request.mock.calls[0]?.[0].owner.activationId).toMatch(/^[a-f\d-]{36}$/)
    expect(outcome.content).toEqual([{ type: 'text', text: '{"status":"observed","message":"Observed controlled page","data":{"text":"Local fixture"}}' }])
    await fiber.dispose()
    expect(ctx.browserUse.providerName).toBeUndefined()
    expect(ctx.tools.schemas(agent).find(tool => tool.name === 'browser_use')).toBeUndefined()
    expect(request.mock.calls.some(([v]) => v.operation.action === 'release')).toBe(true)
  })
  it('projects denied and uncertain outcomes as failures', async () => {
    ctx.provide('desktopBrowser', { request: async () => ({ status: 'uncertain', message: 'Input may already have been delivered. Observe first.' }) })
    await ctx.plugin(Provider)
    const outcome = await execute({ action: 'observe', target: 'owned' })
    expect(outcome.isError).toBe(true)
    expect(JSON.stringify(outcome.content)).toContain('Observe first')
  })
})
