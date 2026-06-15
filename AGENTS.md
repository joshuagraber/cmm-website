<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:cmm-design-system -->
# Cool Molecules Media Design System

- Treat the legacy screenshots in `agent_context/cmm-legacy-screenshots/` as the visual source of truth, with one intentional update: the legacy white background becomes the CMM yellow field for primary brand surfaces.
- Use Tailwind v4 CSS-first tokens in `app/globals.css`; do not add a Tailwind v3 config unless the project intentionally downgrades.
- Prefer shadcn-style, source-owned primitives in `components/ui/` and compose CMM-specific patterns in `components/cmm/`.
- Keep the palette editorial and high-contrast: yellow field, black ink, white paper, restrained warm/cool accents.
- Preserve the legacy feel: stamp logo, serif display headings, clean sans body/nav, underline links, large whitespace, hard-edged image grids, and the asymmetric stamp-corner button.
<!-- END:cmm-design-system -->
