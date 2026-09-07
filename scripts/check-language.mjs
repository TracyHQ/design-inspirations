/**
 * Tracy's own prose in this repository is English. This gate is the only thing that enforces it,
 * because a fluent reader cannot: someone who speaks the language does not perceive it as the wrong
 * language, so the check has to belong to a regex rather than to a reviewer.
 *
 * 🔒 IT MUST NOT SCAN `systems/`, AND THAT IS THE WHOLE POINT OF THIS FILE.
 *
 * An entry is a measurement of somebody's website. A Vietnamese site has Vietnamese headings, a
 * Vietnamese `name`, Vietnamese words in `slots.json`. That is the data being correct. A gate that
 * refused it would either reject honest entries or, worse, push someone to translate them — which
 * is not a fix, it is corrupting a record of what a page says. Same for `catalog.json`, which
 * carries those names.
 *
 * So the gate covers exactly what Tracy wrote: the documents, the licences, the scripts, the
 * workflow. Everything else is third-party data and is left alone.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Tracy-authored paths, relative to the repo root. Anything not named here is not scanned. */
const OURS = ['README.md', 'LICENSE', 'LICENSE-DATA', 'NOTICE', 'scripts', '.github']

/** Letters that exist in Vietnamese and not in English. One is enough to fail. */
const VIETNAMESE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

function* files(rel) {
  const full = path.join(root, rel)
  if (!existsSync(full)) return
  if (statSync(full).isFile()) {
    yield rel
    return
  }
  for (const e of readdirSync(full, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue
    yield* files(path.join(rel, e.name))
  }
}

const bad = []
for (const start of OURS) {
  for (const rel of files(start)) {
    const text = readFileSync(path.join(root, rel), 'utf8')
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      // The gate's own alphabet is not a violation of it.
      if (rel === path.join('scripts', 'check-language.mjs')) break
      if (VIETNAMESE.test(lines[i])) bad.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 100)}`)
    }
  }
}

if (bad.length > 0) {
  console.error(
    `check-language: ${bad.length} line(s) of non-English prose in Tracy's own files:\n  ${bad.slice(0, 20).join('\n  ')}` +
      (bad.length > 20 ? `\n  … and ${bad.length - 20} more` : '')
  )
  process.exit(1)
}
console.log("check-language: Tracy's own files are English")
