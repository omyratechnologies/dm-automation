# Gemai Brand Guidelines

## Logo Usage

### Available Logo Files

Located in `/public/`:
- `Gemai-logo-transperant.png` - Full logo with transparent background (for light backgrounds)
- `Gemai-logo-white-transperant.png` - White logo with transparent background (for dark backgrounds)
- `Gemai-logo.png` - Full logo with solid background
- `Gemai-logo-white.png` - White logo with solid background

### Logo Components

The Gemai logo consists of two main elements:

1. **Icon**: Rounded square with the letter "G" 
   - Modern, bold, and easily recognizable
   - Works as a standalone app icon or favicon
   
2. **Wordmark**: "GEMAI" in bold sans-serif typeface
   - Clean, professional, and highly legible
   - Conveys technology and innovation

### Logo Variants

#### Full Logo (Icon + Wordmark)
Use this as the primary logo for:
- Website headers
- Marketing materials
- Email signatures
- Documentation

```tsx
import GemaiLogo from "@/components/global/gemai-logo";

<GemaiLogo size="lg" />
```

#### Icon Only
Use for:
- Favicons
- App icons
- Social media profiles
- Small UI elements
- Navigation bars (mobile)

```tsx
import { GemaiIcon, GemaiIconSVG } from "@/components/global/gemai-logo";

// Image-based icon
<GemaiIcon size="md" />

// SVG-based icon (better performance for small sizes)
<GemaiIconSVG size={40} />
```

### Sizes

Available sizes: `sm`, `md`, `lg`, `xl`

| Size | Height | Use Case |
|------|--------|----------|
| sm   | 24px   | Small UI elements, inline logos |
| md   | 32px   | Standard navigation, cards (default) |
| lg   | 48px   | Hero sections, large headers |
| xl   | 64px   | Landing pages, promotional materials |

### Theme Adaptation

The logo automatically adapts to light/dark themes:
- **Light mode**: Uses black/colored logo (`Gemai-logo-transperant.png`)
- **Dark mode**: Uses white logo (`Gemai-logo-white-transperant.png`)

This is handled automatically by the `GemaiLogo` component using Next.js `useTheme` hook.

### Spacing & Clear Space

Maintain clear space around the logo equal to the height of the "G" icon:
- Minimum clear space: 8px on all sides for `sm` size
- Minimum clear space: 16px on all sides for `md`+ sizes

### Background Colors

#### Preferred Backgrounds
- White (#FFFFFF)
- Dark slate (#0F172A)
- Light gray (#F8FAFC)
- Dark purple (#1E1B4B)

#### Avoid
- Mid-tone grays that reduce contrast
- Busy patterns or images
- Gradients that interfere with logo legibility

## Brand Colors

### Primary Gradient
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
- Start: `#667eea` (Purple-blue)
- End: `#764ba2` (Deep purple)

This gradient is defined in `tailwind.config.ts` as `bg-gradient-brand`.

### Color Palette

#### Primary Colors
- **Primary Purple**: `#667eea`
- **Secondary Purple**: `#764ba2`
- **Accent Blue**: `#40B7FF`

#### Neutral Colors
- **Dark Background**: `#0F172A`
- **Medium Background**: `#1E293B`
- **Light Background**: `#F8FAFC`
- **Text Primary**: `#F1F5F9`
- **Text Secondary**: `#94A3B8`
- **Text Tertiary**: `#64748B`

### Usage Examples

#### Buttons
```tsx
<Button className="bg-gradient-brand text-white">
  Get Started
</Button>
```

#### Icons
```tsx
<div className="rounded-lg bg-gradient-brand p-3">
  <Icon className="text-white" />
</div>
```

#### Text Gradients
```tsx
<h1 className="bg-gradient-brand bg-clip-text text-transparent">
  Transform Your Business
</h1>
```

## Typography

### Font Family
**Plus Jakarta Sans** - Modern geometric sans-serif
- Configured in `src/app/layout.tsx`
- Imported from Google Fonts

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Heading Hierarchy

```tsx
// H1 - Hero headlines
<h1 className="text-5xl md:text-7xl font-bold">

// H2 - Section titles
<h2 className="text-4xl sm:text-5xl font-bold">

// H3 - Subsection titles
<h3 className="text-2xl font-semibold">

// H4 - Card titles
<h4 className="text-xl font-semibold">
```

## Component Usage

### Landing Page Header
```tsx
import GemaiLogo from "@/components/global/gemai-logo";

<Link href="/" className="flex items-center">
  <GemaiLogo size="lg" className="h-10" />
</Link>
```

### Dashboard Sidebar
```tsx
<div className="flex items-center justify-center p-4">
  <GemaiLogo size="lg" className="h-8" />
</div>
```

### Mobile Menu
```tsx
<GemaiLogo size="lg" className="h-8" />
```

### Favicon & Icons
Dynamic favicon and Open Graph images are generated in:
- `/src/app/icon.tsx` - Standard favicon
- `/src/app/apple-icon.tsx` - Apple touch icon
- `/src/app/opengraph-image.tsx` - Social media preview image

## Don'ts

❌ Don't stretch or distort the logo
❌ Don't rotate the logo
❌ Don't change the logo colors (except white/black for accessibility)
❌ Don't add effects (drop shadows, glows) to the logo files
❌ Don't place on low-contrast backgrounds
❌ Don't recreate or modify the logo design
❌ Don't use old "Slate AI" or "dm.ai" branding

## Do's

✅ Use provided logo files
✅ Maintain aspect ratio
✅ Use adequate clear space
✅ Ensure sufficient contrast
✅ Use theme-appropriate version (dark/light)
✅ Use the `GemaiLogo` component for consistency
✅ Follow size guidelines
✅ Test on different backgrounds

## Quick Reference

### Import Statement
```tsx
import GemaiLogo, { GemaiIcon, GemaiIconSVG } from "@/components/global/gemai-logo";
```

### Common Patterns

```tsx
// Full logo in header
<GemaiLogo size="lg" className="h-10" />

// Icon in sidebar
<GemaiIconSVG size={40} />

// Small inline logo
<GemaiLogo size="sm" />

// Extra large for hero
<GemaiLogo size="xl" />
```

## Contact

For brand-related questions:
- Email: support@gemai.in
- Website: gemai.in

---

© 2025 Omyra Technologies. All rights reserved.
