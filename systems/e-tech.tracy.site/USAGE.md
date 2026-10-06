# E-tech Usage

The customer's own brand as a design-system package, extracted by Tracy's brand engine.

## Read Order

1. Read this file first to understand the package contract.
2. Read `DESIGN.md` for visual intent, constraints, and anti-patterns.
3. Take every colour, font, size and space from `tokens.css` (the 56 tokens every Tracy system shares).
4. Use `components.manifest.json` for the compact component inventory; open `components.html` when exact selectors or states matter.
5. `system/artifacts/*.html` are sample products in this brand; `logos/`, `fonts/`, `imagery/` are the harvested assets.

## Design Highlights

- Brand: E-tech — Plain, practical tools for e-commerce, digital marketing and agency teams to work faster and manage more with less effort.
- Primary: `#1d4ed8` — the accent of the harvested site.
- Type: Inter for display, Inter for body.

## Do

- Keep the palette and type to the tokens; a colour or font outside them is not this brand.
- Reuse the components of `components.html` before inventing parallel ones.

## Avoid

- Avoid raw hex values outside the copied `:root` token block.
- Avoid other brands' logos, taglines or imagery: these files hold the customer's own.
