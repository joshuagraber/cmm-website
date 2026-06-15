# Cool Molecules Media Design System

## Visual Source

The legacy screenshots in `agent_context/cmm-legacy-screenshots/` show a minimal editorial site: stamp logo, oversized serif headings, clean sans navigation, underlined active links, large white space, square photo grids, and simple underline form fields. The new site intentionally restores the earlier vibrant yellow background as the primary brand field.

The full site uses the yellow field in light mode.

Dark mode respects system preference through `prefers-color-scheme: dark`. It follows the same token map but swaps the page and header background to near-black with light yellow foreground, accents, borders, and controls. There is no manual theme-switching API yet.

Status colors are tokenized as `--success`, `--success-foreground`, `--destructive`, and `--destructive-foreground`.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--cmm-yellow` | `#ffe23f` | Primary brand background |
| `--cmm-yellow-soft` | `#fff3a6` | Soft highlight and gradients |
| `--cmm-yellow-pale` | `#fff9d9` | Muted panels |
| `--cmm-black` | `#0b0b0b` | Logo, headings, primary controls |
| `--cmm-ink` | `#171717` | Body text |
| `--cmm-charcoal` | `#343434` | Hover text and secondary ink |
| `--cmm-gray` | `#767676` | Muted text |
| `--cmm-line` | `#d8d4bd` | Borders and separators |
| `--cmm-paper` | `#ffffff` | Content backgrounds |
| `--cmm-cream` | `#fffdf2` | Warm section background |
| `--cmm-coral` | `#ed6a5a` | Editorial accent |
| `--cmm-blue` | `#1d6c8f` | Editorial accent |
| `--cmm-green` | `#587a3d` | Editorial accent |

## Tokens

Tokens live in `app/globals.css` and are exposed through Tailwind v4 `@theme inline`.

- Semantic color tokens: `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`.
- Type tokens: `--font-sans` uses Arial/system sans; `--font-serif` uses Georgia/Times for display. Avoid remote font fetching unless the build environment is updated to support it.
- Radius tokens: `--radius` for ordinary UI and `--radius-button` for the asymmetric legacy button shape.
- Layout tokens: `--spacing-site-x` and `--spacing-section-y` define responsive page gutters and vertical rhythm.

## Component Conventions

Use shadcn-style source-owned components:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/textarea.tsx`

Compose brand-specific components separately:

- `components/cmm/stamp-logo.tsx`
- `components/cmm/site-header.tsx`
- `components/cmm/page-hero.tsx`
- `components/cmm/photo-grid.tsx`
- `components/cmm/profile-card.tsx`
- `components/cmm/contact-form-preview.tsx`

## Asset Locations

Copy exported production images into `public/images/` so they are served from `/images/...`.

Recommended first-pass structure:

- `public/images/about/` for the about page grid and founder portraits.
- `public/images/home/` for homepage or brand-specific imagery.
- `public/images/logos/` for exported logo assets if we replace the CSS placeholder stamp.

Use descriptive kebab-case filenames, for example `joshua-graber-portrait.jpg` or `about-grid-soap-interview.jpg`.

Current image usage:

- `components/cmm/photo-grid.tsx` maps the exported square WebP story images into the about grid.
- `components/cmm/profile-card.tsx` uses founder headshots via `next/image`. Founder images are marked `loading="eager"` with `fetchPriority="high"` to avoid browser lazy-loading stalls on the prominent profile section.
- `components/cmm/stamp-logo.tsx` uses an inline SVG stamp mark with `currentColor` for the border stroke and text fill.
- `app/opengraph-image.tsx` and `app/twitter-image.tsx` generate social preview images with the PNG stamp logo centered on the CMM yellow field.

## Sticky Header

`components/cmm/site-header.tsx` is a client component. It remains visible near the top and until the page is scrolled more than 15% of the available scroll range. After that threshold, it hides on downward scroll and reappears on upward scroll. Scroll events are throttled with `requestAnimationFrame` and a small pixel delta to avoid jitter.

## Form Accessibility

Contact form controls use explicit `label`/`id` associations, native `required` attributes, semantic `name` values, browser `autocomplete` tokens, and visible required text marked `aria-hidden` so screen readers rely on native required semantics. Placeholders provide examples but never replace labels. Inputs and textareas start as underline fields; on focus the underline becomes the bottom edge of a full border outline.

The form posts to `/api/contact`. The route logs valid submissions unless `BREVO_API_KEY` is present. With `BREVO_API_KEY`, it sends through Brevo using `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, and `CONTACT_TO_EMAIL`.

After submission, the route redirects to `/?contact=sent&firstName=...` or `/?contact=error`. `app/page.tsx` reads `searchParams` on the server and passes the stable status into `components/cmm/contact-toast.tsx` to avoid hydration mismatches. The toast scrolls to the top, displays below the sticky header, sizes to its content, uses `--toast-background`, includes subtle SVG success/error icons, is dismissible, and removes the query parameters from the URL.

## Open Decisions

- About grid uses 12 distinct story images for the full 2x6 desktop layout.
- Decide whether the production nav needs a full client-side mobile sheet or a CSS-only menu.
- Decide whether to add official shadcn CLI/dependencies once more interactive primitives are needed.
