# Design inspirations — the community shelf

A design inspiration is one website, measured and written down as a design system: its colours by
frequency, its typefaces, its spacing and radius scale, the shape of its navigation and hero, and a
component kit rendered in those tokens.

Every entry here was produced by Tracy's brand engine from a **public home page**, the same way for
every site, with no model in the loop. The same site measured on the same day yields the same files.

This is the community shelf. Tracy also ships a curated shelf of 152 systems from
[OpenDesign](https://github.com/nexu-io/open-design); nothing here is on that shelf yet.

## Layout

```
catalog.json                          every entry, one row each — the index a client reads first
systems/<host>/
  manifest.json                       id, name, category, source URL, when it was measured, counts
  brand.json                          the brand: colour roles, typography, logo, imagery samples
  DESIGN.md                           the design system in prose, for a person or an agent to read
  tokens.css                          56 semantic tokens
  components.html                     the component kit rendered in those tokens
  slots.json                          where words go in that kit
  artifact-slots.json                 the same for the seven sample products
  artifact-slots/<kind>.json          derived: one file per product, the shape clients fetch
  system/                             the engine's output: seed, token sets, variables, kit, artifacts
  prefetch/material.md                what the harvester measured, before any interpretation
  logos/ fonts/ imagery/              files downloaded from the site
  pages/                              the crawl, when the site was read in full
```

`catalog.json` and `systems/<host>/artifact-slots/` are **generated**. Run `node
scripts/build-catalog.mjs` after changing anything under `systems/`; CI runs it with `--check` and
fails if the committed copy has drifted.

## Using an entry

Everything is a static file, so an entry can be read straight from
`raw.githubusercontent.com/TracyHQ/design-inspirations/main/systems/<host>/…`. The two files worth
starting from are `DESIGN.md`, which reads as documentation, and `tokens.css`, which drops into a
stylesheet.

## How an entry gets here

Someone typed a domain into [Tracy's design inspiration
page](https://cowork.tracy.ai/design-inspiration), or asked a Tracy agent to read a site. The engine
measured it, wrote the folder, and a fleet host published it here on its next pass. Entries are
refreshed rather than duplicated: measuring the same host again replaces its folder.

## Asking for an entry to be removed

Open an issue naming the host, from an address on that domain or with any other evidence that you
speak for the site. We remove the folder and stop re-publishing that host. You do not have to
explain why.

## What is licensed, and what is not

The code in `scripts/` and `.github/` is MIT — see `LICENSE`.

Tracy's own contribution to the data — the measurements, the derived tokens, the prose, the kit, the
slot maps, the index — is CC BY 4.0. See `LICENSE-DATA`.

**The harvested material is not Tracy's to license.** Files under `logos/`, `imagery/`, `fonts/` and
`pages/` were downloaded from the site they name. They are included because a measurement you cannot
check against its source is not a measurement. Trade marks, brand names and images belong to their
owners, and being listed here implies no relationship with, or endorsement by, the site.
