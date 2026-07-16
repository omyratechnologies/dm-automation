# Gemai Marketing Site — $10k Quality Architecture

> Premium is not smooth scroll alone. It is art direction + craft + media + motion + performance working as one system.

## What actually makes a ~$10k site

| Layer | % of perceived quality | Notes |
|-------|------------------------|--------|
| **Art direction & copy** | 25% | Unique voice, hierarchy, restraint |
| **Custom components** | 20% | Not template cards — signature UI |
| **Motion design** | 15% | Choreography with purpose |
| **Media (video, photo, 3D)** | 20% | Real product footage > stock |
| **Typography & spacing** | 10% | Editorial scale, rhythm |
| **Performance & a11y** | 10% | Fast, reduced-motion safe |

Smooth scrolling (Lenis) is table stakes. Without the other layers it still feels empty.

## Stack (marketing route only)

| Tool | Role | When to use |
|------|------|-------------|
| **Lenis** | Momentum smooth scroll | Marketing pages only — never dashboard |
| **Framer Motion** | UI motion, scroll reveals, layout animations | Primary animation system |
| **Three.js + R3F + Drei** | Ambient 3D / hero atmosphere | One focused scene, lazy-loaded, mobile-safe |
| **Next.js Image / Video** | Optimized media | Real product captures, not pure CSS mocks |

**Do not** enable Lenis on `/dashboard/*` — it fights native app scroll and data tables.

## Motion principles (Quiet Professional × premium)

1. **Purpose over spectacle** — every animation explains hierarchy or product
2. **Duration** — 400–900ms for UI; scroll scenes can be longer
3. **Easing** — `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out feel)
4. **Reduced motion** — respect `prefers-reduced-motion: reduce`
5. **No bounce, confetti, or endless pulse**

## Signature components (build these, not generic grids)

1. **MagneticButton** — subtle cursor magnetism on primary CTAs
2. **TextReveal** — line/word stagger on enter
3. **ParallaxMedia** — image/video depth on scroll
4. **ProductStage** — framed product UI with light sweep
5. **AmbientCanvas** — lightweight R3F particle/field (hero only)
6. **HorizontalStrip** — case-style feature stories
7. **Marquee** — quiet social proof
8. **SectionLabel** — tracked editorial labels (`01 — Inbox`)

## Media plan (critical for $10k feel)

Replace pure CSS product mocks over time with:

- **Hero**: 8–12s product screen recording (muted, loop) or high-res stills
- **Features**: 3 short clips (inbox reply, flow publish, lead move)
- **Social proof**: real logos / creator faces when available
- **OG image**: custom 1200×630 brand frame

Store under `apps/web/public/marketing/`.

## Three.js guidelines

- **One** canvas max on the homepage
- Lazy load with `next/dynamic` + `ssr: false`
- Pause when off-screen; lower DPR on mobile
- Prefer abstract atmosphere (soft orbs, field) over heavy models
- Always provide a static CSS fallback

## Performance budget

- LCP < 2.5s on 4G
- Hero 3D < 150KB initial JS when possible (code-split)
- No scroll jank (INP-friendly)
- Test iOS Safari specifically with Lenis `syncTouch`

## Implementation phases

1. **Foundation** — Lenis + Framer providers, signature components, deps
2. **Hero 2.0** — TextReveal + AmbientCanvas + ProductStage
3. **Chapter motion** — scroll-linked product stories
4. **Real media** — record and drop product video/images
5. **Polish** — magnetic CTAs, marquee, reduced-motion audit

## Install (required once)

```bash
cd apps/web
npm install framer-motion lenis three @types/three @react-three/fiber @react-three/drei
```
