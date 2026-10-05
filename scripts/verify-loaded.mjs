/** Load the really installed archive using the candidate's production profile resolver. */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const state = JSON.parse(await readFile(join(root, 'verification/install-state.json'), 'utf8'))
if (process.env.DSH_HOME !== state.home) throw new Error('Refuse non-fixture DSH_HOME')
if (process.env.HOME !== join(state.home, 'user-home') || state.profile !== 'computer-browser-verification') throw new Error('Refuse non-fixture HOME or profile')
const installation = join(state.candidateApp, 'Contents/Resources/app.asar/dsh/node_modules')
const profileBoot = await import(pathToFileURL(join(installation, '@deepseek-ai/dsh/lib/profile-boot.js')).href)
const { createLaunchEnvironmentSnapshot } = await import(pathToFileURL(join(installation, '@deepseek-ai/dsh-launch-environment/lib/index.js')).href)
const { loadProfile } = await import(pathToFileURL(join(installation, '@deepseek-ai/dsh-app-boot/lib/index.js')).href)
const installAnchor = join(installation, '@deepseek-ai/dsh/package.json')
const startedAt = new Date().toISOString()
const bootTimes = []
const overlay = join(state.home, 'load-verification.patch.yml')
await writeFile(overlay, JSON.stringify([{ id: 'sdk-app-startup', disabled: true }, { id: 'sdk-jsonrpc-server', disabled: true }]))
async function boot() {
  bootTimes.push(new Date().toISOString())
  const profile = loadProfile('dsh', state.profile, installAnchor, state.home)
  return (await profileBoot.runProfile({
    environment: createLaunchEnvironmentSnapshot([{ source: 'process', values: process.env }]), profile: state.profile, patchFiles: [overlay], args: [],
    resolvedProfile: { profile, installAnchor },
    prepareContext(ctx) {
      ctx.provide('desktopBrowser', { request: async () => ({ status: 'observed', message: 'isolated broker fixture' }) })
      ctx.provide('browserInteraction', { register: () => () => {} })
      ctx.provide('computerAuthorization', { request: async () => 'deny', revoke: async () => {} })
    },
  })).ctx
}
async function snapshotSessions(directory = join(state.home, 'sessions')) {
  const hashes = {}
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) Object.assign(hashes, await snapshotSessions(path))
    else if (entry.name.endsWith('.jsonl.zstd')) hashes[path] = createHash('sha256').update(await readFile(path)).digest('hex')
  }
  return hashes
}
async function verifySessions(hashes) {
  for (const [path, hash] of Object.entries(hashes)) {
    assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), hash, path)
  }
}
let ctx = await boot()
try {
  // The SDK profile deliberately disables HMR: exercise its real persisted
  // restart-required workflow, including recovery after an interrupted check.
  if (ctx.get('browserUse') === undefined) {
    const recovery = await ctx.pluginManager.setBundleEnabled('@missher/dsh-computer-browser', true)
    assert.equal(recovery.application, 'restart-required', JSON.stringify(recovery))
    await ctx.fiber.dispose()
    ctx = await boot()
  }
  assert.equal(ctx.browserUse.providerName, 'electron-sidebar')
  assert.equal(ctx.computerUse.providerName, 'cua-driver-native')
  assert.equal(ctx.cbuPreservationFixture.value, 'keep')
  const names = ctx.tools.schemas().map(tool => tool.name)
  assert(names.includes('browser_use'))
  assert(names.some(name => name.startsWith('cua_driver_native__')))
  assert(!names.some(name => name.startsWith('cua_driver_native__') && /(^|_)browser(_|$)/u.test(name)))
  const excludedNativeTools = ['page', 'set_config', 'install_ffmpeg', 'replay_trajectory',
    'start_session', 'escalate_session', 'get_session', 'list_sessions', 'get_session_state', 'end_session',
    'start_recording', 'stop_recording', 'get_recording_state']
  for (const name of excludedNativeTools) assert(!names.includes(`cua_driver_native__${name}`), `${name} must remain Host-owned`)
  const sessionId = `installation-preservation-${randomUUID()}`
  const agent = await ctx.agentLoop.create(sessionId, {})
  await agent.whenIdle()
  const before = JSON.stringify(agent.session.snapshotEvents())
  await assert.rejects(async () => await ctx.plugin({
    inject: ['browserUse'], apply(scope) { scope.browserUse.register('conflicting-provider') },
  }), /already registered/u)
  assert.equal(ctx.browserUse.providerName, 'electron-sidebar')
  const disabled = await ctx.pluginManager.setBundleEnabled('@missher/dsh-computer-browser', false)
  assert.equal(disabled.application, 'restart-required', JSON.stringify(disabled))
  assert.equal(JSON.stringify(agent.session.snapshotEvents()), before)
  await ctx.fiber.dispose()
  const sessionHashes = await snapshotSessions()
  assert(Object.keys(sessionHashes).some(path => path.includes(sessionId)))
  ctx = await boot()
  assert.equal(ctx.get('browserUse'), undefined)
  assert.equal(ctx.get('computerUse'), undefined)
  assert(!ctx.tools.schemas().some(tool => tool.name === 'browser_use'))
  assert.equal(ctx.cbuPreservationFixture.value, 'keep')
  await verifySessions(sessionHashes)
  const enabled = await ctx.pluginManager.setBundleEnabled('@missher/dsh-computer-browser', true)
  assert.equal(enabled.application, 'restart-required', JSON.stringify(enabled))
  await ctx.fiber.dispose()
  ctx = await boot()
  assert.equal(ctx.browserUse.providerName, 'electron-sidebar')
  assert.equal(ctx.computerUse.providerName, 'cua-driver-native')
  await verifySessions(sessionHashes)
  Object.assign(state.protected, sessionHashes)
  await writeFile(join(root, 'verification/install-state.json'), JSON.stringify(state, null, 2) + '\n')
  await writeFile(join(root, 'verification/install-load.json'), JSON.stringify({
    status: 'passed', installedEntry: true, candidateApp: state.candidateApp, installAnchor,
    startedAt, completedAt: new Date().toISOString(), bootTimes,
    browser: ctx.browserUse.providerName, computer: ctx.computerUse.providerName,
    model: 'none; no model invocation', osPermissions: 'not granted or changed by this verification',
    browserToolNames: names.filter(name => name === 'browser_use'),
    computerToolNames: names.filter(name => name.startsWith('cua_driver_native__')),
    excludedNativeTools,
    conflictRejected: true, nativeBrowserToolsHidden: true, disabled, enabled,
    unrelatedFixturePreserved: true, sessionEventsPreserved: true, sessionId, sessionFilesPreserved: Object.keys(sessionHashes).length,
    boundary: 'Production runtime and installed Bundle with real native SDK discovery; synthetic Desktop broker; no model or OS input',
  }, null, 2) + '\n')
  console.log('Installed Bundle loaded, conflict refused, disable/re-enable and session preservation passed.')
} finally { await ctx.fiber.dispose() }
