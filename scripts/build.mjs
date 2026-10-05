import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
if (esbuild.version !== pkg.devDependencies.esbuild) throw new Error(`Expected esbuild ${pkg.devDependencies.esbuild}, got ${esbuild.version}`)
// Inline only this repository's providers. Cordis and Host services must retain
// the application's identities; a second runtime would break injection/brands.
const result = await esbuild.build({
  absWorkingDir: root, entryPoints: ['src/index.ts'], outfile: 'lib/index.js',
  bundle: true, packages: 'external', platform: 'node', format: 'esm',
  target: 'es2022', metafile: true,
})
const inputs = []
for (const name of Object.keys(result.metafile.inputs)) {
  const path = resolve(root, name)
  const native = relative(root, path)
  if (!native.startsWith(`src${sep}`)) throw new Error(`Non-owned build input: ${native}`)
  const local = native.split(sep).join('/')
  inputs.push({ path: local, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
}
const imports = result.metafile.outputs['lib/index.js'].imports
const allowed = new Set([...Object.keys(pkg.peerDependencies), ...Object.keys(pkg.dependencies)])
for (const item of imports) {
  const name = item.path.startsWith('@') ? item.path.split('/').slice(0, 2).join('/') : item.path.split('/')[0]
  if (!item.external || (!item.path.startsWith('node:') && !allowed.has(name))) throw new Error(`Undeclared output dependency: ${item.path}`)
}
await mkdir(resolve(root, 'verification'), { recursive: true })
await writeFile(resolve(root, 'verification/build.json'), JSON.stringify({ version: pkg.version, esbuild: esbuild.version, inputs, imports }, null, 2) + '\n')
console.log(`Built ${pkg.name}@${pkg.version}: ${inputs.length} owned modules; shared Host imports remain external.`)
