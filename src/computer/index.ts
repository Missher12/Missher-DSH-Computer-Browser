/**
 * Computer use through the in-process Cua Driver native SDK and its own tools.
 * @module @deepseek-ai/dsh-experimental-computer-use-cua-driver-native
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { ComputerUseProviderName } from '@deepseek-ai/dsh-computer-use/brand'
import { createMcpToolDefinition } from '@deepseek-ai/dsh-mcp-client'
import { HarnessError } from '@deepseek-ai/dsh-llm'
import { z } from 'zod'
import type { CuaDriver as NativeDriver, ToolResult } from '@trycua/cua-driver'
import type {} from '@deepseek-ai/dsh-computer-use'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-browser-use'
import { NativeSessions } from './sessions.ts'
import { nativeMcpResult } from './results.ts'

/** Cordis plugin identity for the native Cua Driver provider. */
export const name = 'experimental-computer-use-cua-driver-native'

/** Services required before the native runtime can publish tools. */
export const inject = ['computerUse', 'tools', 'systemPrompt', 'agents']

/** Native browser exposure and upper bounds for activation-owned grants. */
export interface Config {
  /** Expose native SDK browser tools when no Browser Use provider owns browser access. */
  browserTools: boolean
  /** Maximum lifetime in seconds of one native work segment and its resource grants. */
  sessionTtlSeconds: number
  /** Maximum idle lifetime in seconds, bounded by the total work-segment lifetime. */
  idleTtlSeconds: number
}

/** Preserve browser discovery by default; a Browser Use bundle disables it explicitly. */
export const Config: Schema<Partial<Config>, Config> = Schema.object({
  browserTools: Schema.boolean().default(true),
  sessionTtlSeconds: Schema.number().min(1).max(86_400).step(1).default(3600),
  idleTtlSeconds: Schema.number().min(1).max(86_400).step(1).default(600),
})

const ToolCatalog = z.object({
  tools: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    inputSchema: z.record(z.string(), z.unknown()),
    outputSchema: z.unknown().optional(),
  })),
})

/** DeepSeek's function-name alphabet and maximum length are protocol constants. */
const TOOL_NAME = /^[A-Za-z0-9_-]{1,64}$/u

// Session authority, durable configuration, installation, and recording belong to the Host.
const HOST_MANAGED_TOOLS = new Set([
  'set_config', 'install_ffmpeg', 'replay_trajectory',
  'start_session', 'escalate_session', 'end_session', 'get_session', 'list_sessions', 'get_session_state',
  'start_recording', 'stop_recording', 'get_recording_state',
])

// Cua 0.28 verification internally enables the full AX tree; invoke_menu directly
// traverses AXMenuBar/AXMenu children. Neither can honor capture-only observation.
const UNSAFE_AX_TOOLS = new Set(['verify_state', 'invoke_menu'])

function isBrowserTool(name: string): boolean {
  return name === 'page' || /(^|_)browser(_|$)/u.test(name)
}

const GUIDANCE = `Cua Driver native computer-use tools operate the host desktop. Discover the exact app and window, then get a fresh window screenshot before acting. Use coordinates from that screenshot. Select either target or the legacy pid/window_id fields; do not combine them.

Prefer background delivery. A refusal does not authorize a foreground retry. Verify the requested outcome from fresh state after an action; a delivered click alone does not prove the outcome. After cancellation, inspect current state before retrying because completed input is not rolled back. A desktop work segment belongs to one live session until its turn stops; other sessions cannot interleave native calls. After a user stop or takeover, only the user can resume control and a fresh window snapshot is required. This coordinates this Host only; the user and other applications can still change the desktop.

get_window_state defaults to capture-only: include_accessibility_tree:false and include_screenshot:true. Full window accessibility scans, SDK verify_state, and native AX menu traversal via invoke_menu are disabled because the current SDK can block on application menus; use capture-only screenshots and Browser Use observation for browser page structure. Ordinary screenshot-coordinate and keyboard tools remain available. An empty, failed, or undelivered screenshot does not permit input. For text entry, prefer a separately authorized click to focus the field, then a fresh screenshot, then type_text without x/y on the same exact window. Explicit foreground permission is still required. Sent (unverified) is delivery feedback, not proof of the field value: verify it with a new screenshot or Browser Use observation. If type_text returns type_text_incomplete or any input result is uncertain, inspect the current target and do not automatically replay or append the remaining text. press_key without x/y can perform individual physical keys after separately authorized focus and a fresh screenshot; it is not an automatic fallback for typing failures.

On macOS, cursor-overlay operations may return facility_unavailable even when screenshots and input work.`

const WINDOW_OBSERVATION_DESCRIPTION = 'Capture a fresh screenshot of the exact pid/window_id, with window metadata. Defaults to include_accessibility_tree:false and include_screenshot:true. Full window AX scanning is disabled because Cua 0.28 can block application menus; use Browser Use observation for browser page structure. Ground coordinates on the returned PNG and observe again after every action. A missing or failed PNG does not authorize input.'

function observationArguments(args: Record<string, unknown>): Record<string, unknown> {
  if (args.include_accessibility_tree !== undefined && args.include_accessibility_tree !== false) {
    throw new HarnessError('Full window AX scanning is disabled because the current Cua SDK can block application menus. Use a native screenshot or Browser Use observation for browser page structure.', 'CU_AX_SCAN_DISABLED')
  }
  if (args.include_screenshot !== undefined && args.include_screenshot !== true) {
    throw new HarnessError('Native observation requires a screenshot. Omit include_screenshot or set it to true.', 'CU_SCREENSHOT_REQUIRED')
  }
  return { ...args, include_accessibility_tree: false, include_screenshot: true }
}

function observationSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const properties = typeof schema.properties === 'object' && schema.properties !== null ? schema.properties : {}
  return { ...schema, properties: {
    ...properties,
    include_accessibility_tree: { type: 'boolean', default: false, description: 'Must be false. Full window AX scans are disabled by this provider because the current SDK can block application menus.' },
    include_screenshot: { type: 'boolean', default: true, description: 'Must be true. A fresh inline PNG is required before native input.' },
  } }
}

/**
 * Own one native runtime and expose its catalog through the MCP result adapter.
 * Startup failures roll back every registration. Unload removes tools, aborts
 * calls and image admission, awaits settlement and SDK shutdown, then releases computer use.
 * @param ctx - context providing the exclusive registration and tool services.
 * @param config - browser exposure and native authority lifetime bounds.
 * @returns after native import, runtime creation, and tool discovery complete.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  if (config.idleTtlSeconds > config.sessionTtlSeconds) throw new Error('Native idle TTL must not exceed session TTL')
  const lifetime = new AbortController()
  const pending = new Set<Promise<unknown>>()
  let driver: NativeDriver | undefined
  let sessions: NativeSessions | undefined
  // Cordis announces disposal before it awaits asynchronous plugin startup.
  ctx.on('internal/plugin', (fiber) => {
    if (fiber === ctx.fiber && fiber.uid === null) lifetime.abort()
  }, { global: true })
  let ready: Promise<void> = Promise.resolve()
  const dispose = ctx.effect(function* () {
    yield ctx.computerUse.register(ComputerUseProviderName('cua-driver-native'))
    yield async () => {
      lifetime.abort()
      // apply() reports startup failure; teardown still owns its native handle.
      await ready.catch(() => {})
      await Promise.allSettled(pending)
      await sessions?.dispose()
      if (driver !== undefined) {
        await driver.shutdown()
        driver.uniffiDestroy()
      }
    }
    const child = ctx.plugin({
      name: 'computer-use-cua-driver-native-runtime',
      inject: ['tools', 'systemPrompt'],
      apply: mountRuntime,
    })
    yield child.dispose
    ready = Promise.resolve(child).then(() => {})
  }, 'computer-use-cua-driver-native.runtime')
  try {
    await ready
  } catch (error) {
    await dispose()
    throw error
  }

  /** The child owns tool registrations; the outer effect owns native teardown. */
  async function mountRuntime(inner: Context): Promise<void> {
    const sdk = await import('@trycua/cua-driver')
    lifetime.signal.throwIfAborted()
    // The generated constructor returns its class with an owned binding handle,
    // but declares only CuaDriverLike, which omits uniffiDestroy().
    const activeDriver = driver = sdk.CuaDriver.createConfiguredWithAuthorizationHost({
      claudeCodeCompatibility: false,
      authorization: {
        allowedModes: [sdk.SessionPermissionMode.Standard],
        compatibilityMode: sdk.SessionPermissionMode.Standard,
        unrestrictedAcknowledged: false,
        maxSessionTtlSeconds: BigInt(config.sessionTtlSeconds),
        maxIdleTtlSeconds: BigInt(config.idleTtlSeconds),
      },
    }, {
      authorize: async (request, options) => sessions === undefined
        ? { action: sdk.DriverAuthorizationAction.Cancel, requestDigest: request.requestDigest }
        : sessions.authorize(request, options?.signal),
    }) as NativeDriver
    const activeSessions = sessions = new NativeSessions(inner, sdk, activeDriver, config)
    const catalog = ToolCatalog.parse(JSON.parse(await activeDriver.listToolsJson({ signal: lifetime.signal })))
    lifetime.signal.throwIfAborted()
    const names = new Set<string>()
    const observations = new WeakMap<object, ToolResult>()
    for (const tool of catalog.tools) {
      if (HOST_MANAGED_TOOLS.has(tool.name)) continue
      if (UNSAFE_AX_TOOLS.has(tool.name)) continue
      if (!config.browserTools && isBrowserTool(tool.name)) continue
      const publicName = `cua_driver_native__${tool.name}`
      if (!TOOL_NAME.test(publicName)) {
        throw new Error(`Cua Driver tool "${tool.name}" exceeds the supported function-name format`)
      }
      if (names.has(publicName)) throw new Error(`Cua Driver listed tool "${tool.name}" more than once`)
      names.add(publicName)
      const definition = createMcpToolDefinition(inner, {
        name: publicName,
        rawName: tool.name,
        description: tool.name === 'get_window_state' ? WINDOW_OBSERVATION_DESCRIPTION : tool.description ?? '',
        inputSchema: tool.name === 'get_window_state' ? observationSchema(tool.inputSchema) : tool.inputSchema,
        outputSchema: tool.outputSchema,
        async call(args, execution) {
          const combined = AbortSignal.any([execution.signal, lifetime.signal])
          combined.throwIfAborted()
          if (tool.name === 'check_permissions') {
            if (args.prompt === true) throw new HarnessError('Permission checks do not open OS authorization dialogs. Use the trusted system settings flow.', 'CU_PERMISSION_PROMPT_DISABLED')
            const input = { ...args, prompt: false }
            const result = execution.agent === undefined
              ? await activeDriver.callTool(tool.name, JSON.stringify(input), { signal: combined })
              : await activeSessions.run(execution.agent, tool.name, input, combined)
            combined.throwIfAborted()
            return nativeMcpResult(result, tool.name)
          }
          if (isBrowserTool(tool.name) && inner.get('browserUse')?.providerName !== undefined) {
            throw new HarnessError('Use the configured browser tools for this session. Native browser access is disabled while Browser Use owns the browser.', 'CU_BROWSER_PROVIDER_CONFLICT')
          }
          const agent = execution.agent
          if (agent === undefined) throw new HarnessError('Desktop actions require a live session owner.', 'CU_OWNER_REQUIRED')
          const input = tool.name === 'get_window_state' ? observationArguments(args) : args
          const result = await activeSessions.run(agent, tool.name, input, combined)
          combined.throwIfAborted()
          const raw = nativeMcpResult(result, tool.name)
          if (tool.name === 'get_window_state') observations.set(execution, result)
          return raw
        },
      })
      inner.tools.register(definition)
    }
    inner.on('tools/execute', async (exec, next) => {
      if (!names.has(exec.name)) return next()
      const upstream = exec.signal
      exec.signal = AbortSignal.any([upstream, lifetime.signal])
      const operation = Promise.resolve().then(next)
      pending.add(operation)
      try {
        return await operation
      } finally {
        pending.delete(operation)
        exec.signal = upstream
      }
    })
    inner.on('tools/post-execute', async (exec, result, next) => {
      if (observations.has(exec) && !result.isError && !result.content.some(block => block.type === 'image' && block.attachment.mediaType === 'image/png')) {
        throw new HarnessError('The screenshot could not be delivered to the current model. Input remains blocked. Use a model with image input and an available attachment store, then capture again.', 'CU_SCREENSHOT_UNAVAILABLE')
      }
      return next()
    })
    inner.on('tools/result', (exec, result) => {
      const observation = observations.get(exec)
      observations.delete(exec)
      if (!result.isError && !exec.signal.aborted && !lifetime.signal.aborted && observation !== undefined
        && result.content.some(block => block.type === 'image' && block.attachment.mediaType === 'image/png')) activeSessions.confirmObservation(observation)
    })
    inner.systemPrompt.section({
      name: 'computer-use:cua-driver-native',
      order: inner.systemPrompt.getSectionOrder('TOOL_COMPUTER_USE'),
      text: GUIDANCE,
    })
  }
}
