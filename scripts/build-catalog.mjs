/**
 * Everything derived in this repository, built from `systems/` and nothing else:
 *
 *   catalog.json                            one row per entry — the index a client reads first
 *   systems/<host>/artifact-slots/<k>.json  one file per sample product, split out of artifact-slots.json
 *
 * WHY THE SPLIT. The brand engine writes all seven products' slot maps into one
 * `artifact-slots.json` keyed by kind, because on a lane a host process reads that file and picks
 * the kind. Here there is no process: a browser fetches `artifact-slots/<kind>.json` and expects
 * `{ slots: [...] }`, the same shape and address as the curated shelf. So the split happens once,
 * at publish time, and is committed — a static shelf has to be static all the way down.
 *
 * WHY CATEGORY IS SET HERE. A manifest carries whatever category the lane that wrote it chose:
 * `Your brand` for the site that lane serves, `Reference` for any other. Neither means anything
 * once the folder is published — everything on this shelf is somebody else's site to everybody
 * reading it. So the row says `Community`, and the manifest's own value is ignored rather than
 * corrected, because correcting it would mean rewriting a file that belongs to the lane.
 *
 *   node scripts/build-catalog.mjs           write
 *   node scripts/build-catalog.mjs --check   compare, exit 1 on any difference (CI)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const systemsDir = path.join(root, 'systems')
const CHECK = process.argv.includes('--check')

/** The category every row on this shelf carries. See the header. */
export const COMMUNITY_CATEGORY = 'Community'

/** The seven sample products the engine builds for every entry. */
const ARTIFACT_KINDS = ['landing', 'deck', 'poster', 'email', 'newsletter', 'form', 'typography']

/** A directory name that is a hostname; anything else is not an entry and is never path-joined. */
const HOST = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

/** Every entry directory that has a manifest naming itself. An extraction in flight has neither. */
export function entries(dir = systemsDir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || !HOST.test(e.name)) continue
    let manifest
    try {
      manifest = readJson(path.join(dir, e.name, 'manifest.json'))
    } catch {
      continue
    }
    if (manifest?.id !== `brand:${e.name}`) continue
    out.push({ host: e.name, manifest })
  }
  out.sort((a, b) => a.host.localeCompare(b.host))
  return out
}

/**
 * One catalog row. The first seven fields are what a gallery needs to draw a card without opening
 * anything; the rest is what a person deciding about an entry needs.
 * @param {{ host: string, manifest: Record<string, unknown> }} entry
 */
export function rowOf({ host, manifest }) {
  const source = manifest.source && typeof manifest.source === 'object' ? manifest.source : {}
  return {
    id: `brand:${host}`,
    name: typeof manifest.name === 'string' && manifest.name ? manifest.name : host,
    category: COMMUNITY_CATEGORY,
    vi: manifest.vi === true,
    nav: typeof manifest.nav === 'string' ? manifest.nav : 'top-left',
    hero: typeof manifest.hero === 'string' ? manifest.hero : 'centered',
    // An entry's dark theme is the engine's own, derived from the same tokens: always usable.
    dark: true,
    host,
    url: typeof source.url === 'string' ? source.url : `https://${host}/`,
    extractedAt: typeof source.extractedAt === 'string' ? source.extractedAt : null,
    pages: source.pages === true,
    counts: manifest.counts && typeof manifest.counts === 'object' ? manifest.counts : {}
  }
}

/** The files this script owns, as `relative path → text`. */
export function derived(list) {
  const files = new Map()
  const rows = list.map(rowOf)
  // Newest first: the shelf is read by people looking at what just arrived.
  rows.sort((a, b) => String(b.extractedAt ?? '').localeCompare(String(a.extractedAt ?? '')))
  files.set(
    'catalog.json',
    `${JSON.stringify(
      {
        schemaVersion: 'tracy-community-inspirations/v1',
        count: rows.length,
        updatedAt: rows[0]?.extractedAt ?? null,
        systems: rows
      },
      null,
      2
    )}\n`
  )
  for (const { host } of list) {
    let all
    try {
      all = readJson(path.join(systemsDir, host, 'artifact-slots.json'))
    } catch {
      continue
    }
    const artifacts = all?.artifacts && typeof all.artifacts === 'object' ? all.artifacts : {}
    for (const kind of ARTIFACT_KINDS) {
      const slots = Array.isArray(artifacts[kind]) ? artifacts[kind] : []
      files.set(
        path.join('systems', host, 'artifact-slots', `${kind}.json`),
        `${JSON.stringify({ slots })}\n`
      )
    }
  }
  return files
}

const list = entries()
const files = derived(list)

if (CHECK) {
  const wrong = []
  for (const [rel, text] of files) {
    const file = path.join(root, rel)
    let have = null
    try {
      have = readFileSync(file, 'utf8')
    } catch {
      // missing
    }
    if (have !== text) wrong.push(rel)
  }
  // A leftover split file for an entry that was removed is drift too, and the only way to see it.
  for (const dir of existsSync(systemsDir) ? readdirSync(systemsDir) : []) {
    const slots = path.join(systemsDir, dir, 'artifact-slots')
    if (!existsSync(slots)) continue
    for (const f of readdirSync(slots))
      if (!files.has(path.join('systems', dir, 'artifact-slots', f)))
        wrong.push(path.join('systems', dir, 'artifact-slots', f))
  }
  if (wrong.length > 0) {
    console.error(
      `build-catalog --check: ${wrong.length} file(s) differ from what systems/ says they should be:\n  ${wrong.slice(0, 20).join('\n  ')}` +
        (wrong.length > 20 ? `\n  … and ${wrong.length - 20} more` : '') +
        '\nRun: node scripts/build-catalog.mjs'
    )
    process.exit(1)
  }
  console.log(`build-catalog --check: ${list.length} entr(ies), ${files.size} generated file(s) match`)
} else {
  for (const dir of existsSync(systemsDir) ? readdirSync(systemsDir) : []) {
    const slots = path.join(systemsDir, dir, 'artifact-slots')
    if (existsSync(slots)) rmSync(slots, { recursive: true, force: true })
  }
  for (const [rel, text] of files) {
    const file = path.join(root, rel)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  console.log(`build-catalog: ${list.length} entr(ies), ${files.size} generated file(s)`)
}
