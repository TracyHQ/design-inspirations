/**
 * Structural checks on `systems/`, run before anything is published and again in CI.
 *
 * The one thing this catches that nothing else can: a folder that LOOKS like an entry but cannot be
 * drawn. A client fetches six files per entry and has no way to report a missing one — a card just
 * renders empty, and the reader assumes the site is dull rather than the entry broken. So the six
 * are checked here, where a failure has somewhere to be printed.
 *
 * No network, no dependencies.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const systemsDir = path.join(root, 'systems')

const HOST = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

/** What a client fetches. Missing any of them is an entry that draws as an empty card. */
const REQUIRED = [
  'manifest.json',
  'brand.json',
  'DESIGN.md',
  'tokens.css',
  'components.html',
  'slots.json',
  'artifact-slots.json'
]

const problems = []
const say = (host, message) => problems.push(`${host}: ${message}`)

const dirs = existsSync(systemsDir)
  ? readdirSync(systemsDir, { withFileTypes: true }).filter((e) => e.isDirectory())
  : []

for (const entry of dirs) {
  const host = entry.name
  if (!HOST.test(host)) {
    say(host, 'directory name is not a hostname')
    continue
  }
  const dir = path.join(systemsDir, host)
  for (const file of REQUIRED) {
    const full = path.join(dir, file)
    if (!existsSync(full)) {
      say(host, `missing ${file}`)
      continue
    }
    if (statSync(full).size === 0) say(host, `${file} is empty`)
  }
  let manifest = null
  try {
    manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  } catch (error) {
    say(host, `manifest.json does not parse: ${error.message}`)
    continue
  }
  // The id is how a client addresses the entry; a mismatch sends it to a folder that is not there.
  if (manifest.id !== `brand:${host}`) say(host, `manifest id is ${manifest.id}, expected brand:${host}`)
  if (manifest.host !== undefined && manifest.host !== host)
    say(host, `manifest host is ${manifest.host}, expected ${host}`)
  const at = manifest.source?.extractedAt
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at)))
    say(host, 'manifest source.extractedAt is not a date — the shelf sorts on it')
}

if (problems.length > 0) {
  console.error(`validate: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`validate: ${dirs.length} entr(ies), no problems`)
