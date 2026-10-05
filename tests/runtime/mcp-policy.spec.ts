/** Real published MCP transport; the child is only a local deterministic fixture. */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import BrowserUse from '@deepseek-ai/dsh-browser-use'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@deepseek-ai/dsh-agent-loop-testkit'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { expect, it } from 'vitest'
import { mountSessionMcp } from '../../src/browser/runtime/mcp.ts'
import type { BrowserInteractionController } from '../../src/contracts/control.ts'

it('enforces execution policy and trusted stop even when the published MCP catalog has no excludedTools', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-independent-mcp-'))
  const ctx = new Context()
  let controls: BrowserInteractionController | undefined
  try {
    await ctx.plugin(BrowserUse)
    await mountAgentLoopTestDependencies(ctx)
    const harness = await mountAgentLoopTestHarness(ctx)
    ctx.provide('browserInteraction', { register(_agent, controller) { controls = controller; return () => { controls = undefined } } })
    await ctx.plugin({
      inject: ['browserUse', 'tools', 'agents', 'systemPrompt'],
      apply(inner: Context) {
        mountSessionMcp(inner, {
          name: 'browser-fixture', exclusive: false, privateWorkspace: true,
          command: process.execPath, args: [fileURLToPath(new URL('./mcp-fixture.mjs', import.meta.url)), root],
          deniedTools: ['disconnect'], observationTools: ['visit'],
        })
      },
    })
    const agent = await harness.create(SessionId('mcp-policy-owner'))
    const execute = (name: string) => ctx.tools.execute({
      agent, name: `mcp__browser-fixture__${name}`, arguments: name === 'visit' ? { label: 'isolated' } : {},
      callId: ToolCallId(name), signal: new AbortController().signal,
    })
    // The old published Host still advertises this name. This regression proves
    // the provider's executor denial independently of the newer catalog filter.
    expect(ctx.tools.schemas(agent).map(tool => tool.name)).toContain('mcp__browser-fixture__disconnect')
    expect((await execute('disconnect')).isError).toBe(true)
    expect(await readFile(join(root, 'events.ndjson'), 'utf8')).not.toContain('"event":"call"')
    const result = await execute('visit')
    expect(result.isError).toBe(false)
    const cwd = (result.value as { structuredContent: { cwd: string } }).structuredContent.cwd
    expect(cwd).not.toBe(root)
    await writeFile(join(cwd, 'owned-output'), 'temporary')
    expect(controls?.state().status).toBe('ready')
    await controls!.stop('taken-over')
    expect((await execute('visit')).isError).toBe(true)
    await controls!.resume()
    expect((await execute('visit')).isError).toBe(false)
    await ctx.fiber.dispose()
    await expect(readFile(join(cwd, 'owned-output'))).rejects.toMatchObject({ code: 'ENOENT' })
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})
