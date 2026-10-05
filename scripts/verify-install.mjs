/** Real CLI/PluginManager package transactions in one disposable, retained DSH_HOME. */
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = process.env.DSH_TEST_APP
if (!app) throw new Error('DSH_TEST_APP must name the isolated candidate .app')
const resources = join(app, 'Contents/Resources')
const carrier = join(resources, 'app.asar/dsh')
const runtime = join(resources, 'runtime')
const cli = join(carrier, 'node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js')
const node = join(app, 'Contents/MacOS/DeepSeek Harness')
const statePath = join(root, 'verification/install-state.json')
const phase = process.argv[2] ?? 'prepare'
let state
if (phase === 'prepare') {
  const home = await mkdtemp(join(tmpdir(), 'dsh-cbu-market-'))
  await mkdir(join(home, 'user-home'))
  const bin = join(home, 'bin')
  await mkdir(bin)
  await symlink(join(runtime, 'pnpm/bin/pnpm.mjs'), join(bin, 'pnpm'))
  state = { home, profile: 'computer-browser-verification', candidateApp: app, commands: [] }
  await mkdir(join(root, 'verification'), { recursive: true })
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 })
} else {
  state = JSON.parse(await readFile(statePath, 'utf8'))
  if (state.candidateApp !== app) throw new Error('Candidate application changed between installation phases')
}
const profileDir = join(state.home, 'profiles', state.profile)
if (state.profile !== 'computer-browser-verification') throw new Error('Refuse non-fixture profile')
// Carry only process/transport settings; model keys, NODE_OPTIONS, npm userconfig,
// DSH overrides and credentials must not enter this isolated launch snapshot.
const inherited = Object.fromEntries([
  'PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM', 'COLORTERM', 'TMPDIR', 'TMP', 'TEMP',
  'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'all_proxy', 'no_proxy',
].flatMap(key => process.env[key] === undefined ? [] : [[key, process.env[key]]]))
const env = {
  ...inherited, HOME: join(state.home, 'user-home'), DSH_HOME: state.home, DSH_TELEMETRY_DISABLED: '1', ELECTRON_RUN_AS_NODE: '1',
  DSH_DESKTOP_NODE_EXECUTABLE: join(app, 'Contents/MacOS/DeepSeek Harness'),
  PATH: [join(state.home, 'bin'), join(runtime, 'bin'), process.env.PATH].join(':'),
}
async function run(label, args, expectedCode = 0) {
  const started = new Date().toISOString()
  let output = ''
  const child = spawn(node, [cli, ...args], { cwd: root, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  // Bound this verification process; no user profile or unrelated process is targeted.
  const timer = setTimeout(() => { if (child.pid) process.kill(-child.pid, 'SIGTERM') }, 180_000)
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
  clearTimeout(timer)
  await writeFile(join(root, 'verification', `install-${label}.log`), output)
  state.commands.push({ label, args, started, code })
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
  console.log(JSON.stringify({ label, code, output: output.slice(-1800) }))
  if (code !== expectedCode) throw new Error(`CLI ${label} failed; see verification/install-${label}.log`)
  return output
}
const plugin = (...args) => ['plugin', '--profile', state.profile, ...args]
if (phase === 'prepare') {
  await run('initialize', ['--profile', state.profile, '--from-default-profile', 'sdk', '--dump-config'])
  await run('help', plugin('--help'))
  // Retain the application's policy defaults. Copy only existing exact native-runtime
  // exemptions reviewed in the matching source; never lower trust or release-age policy.
  const policy = [
    '', 'minimumReleaseAgeExclude:',
    ...['@trycua/cua-driver', '@trycua/cua-driver-darwin-arm64', '@trycua/cua-driver-darwin-x64', '@trycua/cua-driver-linux-arm64-gnu', '@trycua/cua-driver-linux-x64-gnu', '@trycua/cua-driver-win32-arm64-msvc', '@trycua/cua-driver-win32-x64-msvc'].map(name => `  - '${name}@0.28.0'`), '',
  ].join('\n')
  await writeFile(join(profileDir, 'pnpm-workspace.yaml'), await readFile(join(profileDir, 'pnpm-workspace.yaml'), 'utf8') + policy)
  const fixture = join(state.home, 'fixture-plugin')
  await mkdir(fixture)
  await writeFile(join(fixture, 'package.json'), JSON.stringify({ name: '@fixture/cbu-preservation', version: '0.0.0', type: 'module', main: './index.js', dsh: { bundle: { patch: './cordis.patch.yml' } } }, null, 2))
  await writeFile(join(fixture, 'index.js'), 'export function apply(ctx) { ctx.provide("cbuPreservationFixture", { value: "keep" }) }\n')
  await writeFile(join(fixture, 'cordis.patch.yml'), '- insert:\n    - id: cbu-preservation-fixture\n      name: "@fixture/cbu-preservation"\n')
  await run('fixture-add', plugin('add', fixture, '--offline'))
  const sessionDir = join(state.home, 'sessions')
  await mkdir(sessionDir, { recursive: true })
  await writeFile(join(sessionDir, 'preserved-fixture.jsonl'), '{"fixture":"unrelated-session-data","value":"preserve byte for byte"}\n')
  state.protected = {}
  for (const path of [join(profileDir, 'cordis.patch.yml'), join(fixture, 'index.js'), join(sessionDir, 'preserved-fixture.jsonl')]) {
    state.protected[path] = createHash('sha256').update(await readFile(path)).digest('hex')
  }
  state.baselineManifest = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
  state.baselineConfig = await run('before', ['--profile', state.profile, '--dump-config'])
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
} else if (phase === 'add') {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const archive = join(root, `.artifacts/missher-dsh-computer-browser-${pkg.version}.tgz`)
  await run('bundle-add', plugin('add', archive, ...process.env.DSH_TEST_OFFLINE === '1' ? ['--offline'] : []))
  const expected = await mkdtemp(join(state.home, 'expected-package-'))
  const extraction = spawnSync('tar', ['-xzf', archive, '-C', expected], { encoding: 'utf8' })
  if (extraction.status !== 0) throw new Error(extraction.stderr || 'Candidate archive extraction failed')
  const manifest = JSON.parse(await readFile(join(root, '.artifacts/package-manifest.json'), 'utf8'))
  for (const { path } of manifest.files) {
    const archived = await readFile(join(expected, 'package', path))
    const installed = await readFile(join(profileDir, 'node_modules/@missher/dsh-computer-browser', path))
    if (!archived.equals(installed)) throw new Error(`Installed file differs from exact archive: ${path}`)
  }
  state.verifiedPackageSha256 = createHash('sha256').update(await readFile(archive)).digest('hex')
  state.verifiedPackageFiles = manifest.files.length
  state.uninstallRestored = false
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
  await run('after', ['--profile', state.profile, '--dump-config'])
} else if (phase === 'reject') {
  const rejected = join(state.home, 'rejected-update')
  await mkdir(rejected, { recursive: true })
  await writeFile(join(rejected, 'package.json'), JSON.stringify({
    name: '@missher/dsh-computer-browser', version: '0.1.0-candidate.reject', type: 'module',
    dsh: { bundle: { patch: './cordis.patch.yml' } }, peerDependencies: { '@deepseek-ai/dsh': '999.0.0' },
  }, null, 2))
  await writeFile(join(rejected, 'cordis.patch.yml'), '[]\n')
  const protectedPaths = [join(profileDir, 'package.json'), join(profileDir, 'pnpm-lock.yaml'),
    join(profileDir, 'node_modules/@missher/dsh-computer-browser/package.json'), join(profileDir, 'node_modules/@missher/dsh-computer-browser/lib/index.js'),
    ...Object.keys(state.protected)]
  const before = await Promise.all(protectedPaths.map(path => readFile(path)))
  const result = await run('rejected-update', plugin('add', rejected, '--offline'), 1)
  if (!result.includes('installation rejected') || !result.includes('nothing was installed')) throw new Error('Expected preflight compatibility refusal')
  for (const [index, path] of protectedPaths.entries()) {
    if (!before[index].equals(await readFile(path))) throw new Error(`Rejected installation changed ${path}`)
  }
  state.rejectedUpdatePreserved = true
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
} else if (phase === 'rollback') {
  // The root manifest passes preflight; its malformed bundle patch is detected
  // only after pnpm has replaced the installed package, exercising real repair.
  const rejected = join(state.home, 'invalid-patch-update')
  await mkdir(rejected, { recursive: true })
  await writeFile(join(rejected, 'package.json'), JSON.stringify({
    name: '@missher/dsh-computer-browser', version: '0.1.0-candidate.invalid-patch', type: 'module',
    dsh: { bundle: { patch: './cordis.patch.yml' } },
  }, null, 2))
  await writeFile(join(rejected, 'cordis.patch.yml'), '- insert: [\n')
  const protectedPaths = [join(profileDir, 'package.json'), join(profileDir, 'pnpm-lock.yaml'),
    join(profileDir, 'node_modules/@missher/dsh-computer-browser/package.json'), join(profileDir, 'node_modules/@missher/dsh-computer-browser/lib/index.js'),
    ...Object.keys(state.protected)]
  const before = await Promise.all(protectedPaths.map(path => readFile(path)))
  const result = await run('rolled-back-update', plugin('add', rejected, '--offline'), 1)
  if (!result.includes('restored package.json, pnpm-lock.yaml, and node_modules')) throw new Error('Expected complete installed-tree rollback')
  for (const [index, path] of protectedPaths.entries()) {
    if (!before[index].equals(await readFile(path))) throw new Error(`Rollback changed ${path}`)
  }
  state.failedInstallRolledBack = true
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
} else if (phase === 'load') {
  const child = spawn(node, [join(root, 'scripts/verify-loaded.mjs')], { cwd: root, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  child.stdout.on('data', chunk => { output += chunk })
  child.stderr.on('data', chunk => { output += chunk })
  const timer = setTimeout(() => { if (child.pid) process.kill(-child.pid, 'SIGTERM') }, 90_000)
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) })
  clearTimeout(timer)
  await writeFile(join(root, 'verification/install-load.log'), output)
  console.log(JSON.stringify({ label: 'load', code, output: output.slice(-2200) }))
  if (code !== 0) throw new Error('Installed runtime check failed; see verification/install-load.log')
} else if (phase === 'remove') {
  await run('bundle-remove', plugin('remove', '@missher/dsh-computer-browser', '--config.offline=true'))
  const after = await run('removed', ['--profile', state.profile, '--dump-config'])
  if (after !== state.baselineConfig) throw new Error('Composed config differs after removing Bundle')
  const manifest = JSON.parse(await readFile(join(profileDir, 'package.json'), 'utf8'))
  if (JSON.stringify(manifest.dependencies) !== JSON.stringify(state.baselineManifest.dependencies) || JSON.stringify(manifest.dsh) !== JSON.stringify(state.baselineManifest.dsh)) throw new Error('Unrelated dependencies or bundle choices changed')
  for (const [path, hash] of Object.entries(state.protected)) {
    if (createHash('sha256').update(await readFile(path)).digest('hex') !== hash) throw new Error(`Protected fixture changed: ${path}`)
  }
  state.uninstallRestored = true
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n')
} else throw new Error(`Unsupported phase: ${phase}`)
