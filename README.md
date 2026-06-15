# Cool Molecules Media Website

Modern Next.js rewrite of `coolmolecules.media`.

The first implementation pass defines the CMM design system from the legacy screenshots in `agent_context/cmm-legacy-screenshots/`. The primary visual shift is restoring the former vibrant yellow background as the brand field while retaining the stamp logo, editorial serif type, clean navigation, underline links, and minimal form language.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Design System

- Tokens live in `app/globals.css` using Tailwind v4 `@theme inline`.
- Source-owned shadcn-style primitives live in `components/ui/`.
- CMM-specific composed components live in `components/cmm/`.
- Design notes live in `agent_context/design-system.md`.
- Font tokens use local system stacks so production builds do not depend on fetching remote Google fonts.
- Exported production images should go in `public/images/` and will be available at `/images/...`.
- The single-page header is sticky and hides on downward scroll after the page passes the 15% scroll threshold.
- Light mode uses a full yellow site background. Dark mode respects system preference through `prefers-color-scheme: dark` and uses near-black surfaces with light yellow text and accents.

## Contact Form

The contact form posts to `app/api/contact/route.ts`.

By default, submissions are validated and logged server-side. To send email through Brevo, set these environment variables:

```bash
BREVO_API_KEY=...
BREVO_FROM_EMAIL="contact@coolmolecules.media"
BREVO_FROM_NAME="Cool Molecules Media"
CONTACT_TO_EMAIL="hello@coolmolecules.media"
```

`BREVO_FROM_EMAIL` must be a sender registered and verified in Brevo.

## Learn More

This repo is on Next.js 16. Before writing framework code, read the relevant local docs in `node_modules/next/dist/docs/` as noted in `AGENTS.md`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
