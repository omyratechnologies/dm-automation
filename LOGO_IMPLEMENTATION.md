# Gemai Logo Implementation Examples

This document provides practical examples of how the Gemai logo is implemented across the application.

## Component Location

**Primary Logo Component**: `/src/components/global/gemai-logo/index.tsx`

## Logo Variants in Use

### 1. Website Landing Page Header

**File**: `/src/app/(website)/page.tsx`

```tsx
import GemaiLogo from "@/components/global/gemai-logo";

export default function Home() {
  return (
    <header>
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <GemaiLogo size="lg" className="h-10" />
        </Link>
        {/* Navigation */}
      </div>
    </header>
  );
}
```

**Purpose**: Main brand presence on the public website
**Size**: Large (48px height)
**Theme**: Auto-adapts (dark logo on light bg, white logo on dark bg)

---

### 2. Dashboard Sidebar

**File**: `/src/components/global/sidebar/index.tsx`

```tsx
import GemaiLogo from "@/components/global/gemai-logo";

const Sidebar = ({ slug }: Props) => {
  return (
    <div className="sidebar">
      <div className="flex items-center justify-center p-4">
        <GemaiLogo size="lg" className="h-8" />
      </div>
      {/* Sidebar content */}
    </div>
  );
}
```

**Purpose**: Persistent branding in the application sidebar
**Size**: Large (but constrained to 32px height via className)
**Theme**: Auto-adapts based on user's theme preference

---

### 3. Mobile Menu (InfoBar)

**File**: `/src/components/global/InfoBar/index.tsx`

```tsx
import GemaiLogo from "@/components/global/gemai-logo";

const InfoBar = ({ slug }: Props) => {
  return (
    <Sheet side="left">
      <div className="mobile-menu">
        <div className="flex items-center justify-center p-4">
          <GemaiLogo size="lg" className="h-8" />
        </div>
        {/* Menu items */}
      </div>
    </Sheet>
  );
}
```

**Purpose**: Branding in mobile navigation drawer
**Size**: Large (32px height)
**Theme**: Auto-adapts

---

## Icon-Only Usage

For situations where space is limited, use the icon-only variants:

### SVG Icon (Recommended for small sizes)

```tsx
import { GemaiIconSVG } from "@/components/global/gemai-logo";

// In a navigation bar
<GemaiIconSVG size={32} className="cursor-pointer" />

// In a button
<button className="flex items-center gap-2">
  <GemaiIconSVG size={24} />
  <span>Dashboard</span>
</button>

// As an avatar/profile icon
<GemaiIconSVG size={40} className="shadow-lg" />
```

### Image Icon (Better quality for larger sizes)

```tsx
import { GemaiIcon } from "@/components/global/gemai-logo";

// Medium size
<GemaiIcon size="md" />

// Large size
<GemaiIcon size="lg" className="shadow-xl" />
```

---

## Advanced Usage Examples

### 1. Animated Logo Link

```tsx
<Link 
  href="/" 
  className="transition-transform hover:scale-105 duration-200"
>
  <GemaiLogo size="lg" className="h-10" />
</Link>
```

### 2. Logo with Loading State

```tsx
import { Skeleton } from "@/components/ui/skeleton";

function Header() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div>
      {isLoading ? (
        <Skeleton className="h-10 w-40" />
      ) : (
        <GemaiLogo size="lg" className="h-10" />
      )}
    </div>
  );
}
```

### 3. Responsive Logo Sizing

```tsx
<GemaiLogo 
  size="md" 
  className="h-6 md:h-8 lg:h-10"
/>
```

### 4. Logo in Card Header

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <GemaiIconSVG size={40} />
      <div>
        <CardTitle>Welcome to Gemai</CardTitle>
        <CardDescription>AI-Powered Automation</CardDescription>
      </div>
    </div>
  </CardHeader>
</Card>
```

### 5. Logo in Email Template

```tsx
// For email templates, use absolute URL
<img 
  src="https://gemai.in/Gemai-logo-transperant.png"
  alt="Gemai"
  width="160"
  height="40"
/>
```

---

## Meta Tags & SEO

### Favicon (Dynamic)

**File**: `/src/app/icon.tsx`

Automatically generates a favicon with the "G" icon using Next.js Image Response API.

### Apple Touch Icon

**File**: `/src/app/apple-icon.tsx`

Generates iOS home screen icon.

### Open Graph Image

**File**: `/src/app/opengraph-image.tsx`

Generates social media preview image with:
- Gemai "G" icon
- "GEMAI" wordmark
- Tagline
- Key features

**Dimensions**: 1200×630px (optimal for Facebook, Twitter, LinkedIn)

---

## Static Image References

For situations where you need direct image paths:

```tsx
// Light backgrounds
<img src="/Gemai-logo-transperant.png" alt="Gemai" />

// Dark backgrounds
<img src="/Gemai-logo-white-transperant.png" alt="Gemai" />

// With Next.js Image component
import Image from "next/image";

<Image
  src="/Gemai-logo-transperant.png"
  alt="Gemai - AI-Powered Instagram Automation"
  width={160}
  height={40}
  priority
/>
```

---

## Accessibility Best Practices

### 1. Always Include Alt Text

```tsx
// Good
<GemaiLogo size="lg" className="h-10" />
// Component includes proper alt text internally

// For custom images
<img 
  src="/Gemai-logo-transperant.png" 
  alt="Gemai - AI-Powered Instagram Automation"
/>
```

### 2. Ensure Contrast Ratios

```tsx
// Good - High contrast
<div className="bg-white">
  <GemaiLogo size="lg" /> {/* Uses dark logo */}
</div>

<div className="bg-slate-900">
  <GemaiLogo size="lg" /> {/* Automatically uses white logo */}
</div>

// Avoid - Low contrast
<div className="bg-gray-500">
  <GemaiLogo size="lg" /> {/* May have contrast issues */}
</div>
```

### 3. Make Logos Clickable When Appropriate

```tsx
<Link href="/" aria-label="Go to Gemai homepage">
  <GemaiLogo size="lg" className="h-10" />
</Link>
```

---

## Performance Optimization

### 1. Use Priority Loading for Above-Fold Logos

```tsx
// In hero section or main header
<Image
  src="/Gemai-logo-transperant.png"
  alt="Gemai"
  width={160}
  height={40}
  priority // Prevents lazy loading
/>
```

### 2. Use SVG Icons for Small Sizes

```tsx
// Better performance for small icons
<GemaiIconSVG size={24} /> // ✅ Lightweight, crisp

// vs
<GemaiIcon size="sm" /> // ⚠️ Heavier, requires image loading
```

### 3. Optimize Loading with Suspense

```tsx
import { Suspense } from "react";

<Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse" />}>
  <GemaiLogo size="lg" className="h-10" />
</Suspense>
```

---

## Migration from Old Branding

If you're updating from "Slate AI" branding:

### Before
```tsx
<div className="flex items-center gap-2">
  <div className="h-8 w-8 rounded-lg bg-gradient-brand">
    S
  </div>
  <span>Slate AI</span>
</div>
```

### After
```tsx
import GemaiLogo from "@/components/global/gemai-logo";

<GemaiLogo size="lg" className="h-8" />
```

---

## Testing Checklist

When implementing the logo, verify:

- [ ] Logo displays correctly in light mode
- [ ] Logo displays correctly in dark mode
- [ ] Logo scales properly on mobile devices
- [ ] Logo maintains aspect ratio
- [ ] Logo has adequate clear space
- [ ] Logo is clickable when used as navigation
- [ ] Alt text is meaningful and descriptive
- [ ] Logo loads with acceptable performance
- [ ] Logo appears in favicon
- [ ] Logo appears in social media previews (OG image)

---

## Common Issues & Solutions

### Issue: Logo appears blurry
**Solution**: Use larger size variant or SVG icon for small sizes

### Issue: Logo doesn't change with theme
**Solution**: Ensure component is wrapped in ThemeProvider and using `useTheme`

### Issue: Logo too large on mobile
**Solution**: Use responsive className: `className="h-6 md:h-8 lg:h-10"`

### Issue: Logo not centered
**Solution**: Use flex utilities: `className="flex items-center justify-center"`

---

## Support

For implementation questions:
- Check BRAND_GUIDELINES.md
- Review this document
- Contact: support@gemai.in

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
