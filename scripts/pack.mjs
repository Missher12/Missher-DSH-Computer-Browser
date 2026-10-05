import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const built = spawnSync(process.execPath, [resolve(root, 'scripts/build.mjs')], { cwd: root, encoding: 'utf8' })
if (built.status !== 0) throw new Error(built.stderr || 'Build failed; refusing to package stale output')
const output = resolve(root, '.artifacts')
await mkdir(output, { recursive: true })
const result = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', output], { cwd: root, encoding: 'utf8' })
if (result.status !== 0) throw new Error(result.stderr || 'npm pack failed')
const [packed] = JSON.parse(result.stdout)
if (packed.files.some(file => /(^|\/)(node_modules|tests|verification|src|scripts)(\/|$)/u.test(file.path))) throw new Error('Unexpected development files in candidate package')
for (const required of ['lib/index.js', 'cordis.patch.yml', 'README.md', 'README.zh.md', 'VALIDATION.md', 'COMPATIBILITY.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'SOURCE_ORIGINS.json']) {
  if (!packed.files.some(file => file.path === required)) throw new Error(`Missing package entry: ${required}`)
}
const sha256 = createHash('sha256').update(await readFile(resolve(output, packed.filename))).digest('hex')
await writeFile(resolve(output, 'package-manifest.json'), JSON.stringify({ ...packed, sha256 }, null, 2) + '\n')
console.log(JSON.stringify({ path: resolve(output, packed.filename), sha256, files: packed.files.length }, null, 2))
