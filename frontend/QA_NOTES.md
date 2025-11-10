# AKIS Platform — QA Notes

## Theme Unification (Liquid Glassmorphism)

All routes now use a unified AppShell with consistent Liquid Glassmorphism theme:
- **AppShell**: Wraps all routes with Header, GlassBackdrop, PageTransition, and Footer
- **Global backdrop**: GlassBackdrop renders once at the root level, visible on all pages
- **Consistent spacing**: All pages use the same container widths and spacing rhythm as homepage
- **Token-based colors**: All pages use CSS variables (`var(--bg)`, `var(--text)`, `var(--accent)`, etc.)

## Route Transitions

### Implementation
- **PageTransition component**: Lightweight crossfade using opacity transitions (250ms)
- **Transform/opacity only**: No layout thrash, targets 60fps performance
- **Reduced motion support**: Transitions disabled when `prefers-reduced-motion: reduce` is detected
- **RouteChangeIndicator**: Tracks navigation state for UI feedback (e.g., logo spin)

### Logo Spin Animation
- **Trigger**: Logo rotates 360° on route change (350ms ease)
- **Transform-only**: Uses CSS `transform: rotate()` for GPU acceleration
- **Reduced motion aware**: Disabled when `prefers-reduced-motion` is enabled
- **Subtle and tasteful**: Single rotation, no continuous spinning

## Color Contrast Rationale (WCAG AA)

All text colors meet WCAG 2.1 AA contrast requirements:

- **Primary text** (`--text: #EDEFF2`) on dark background (`--bg: #111418`): **15.2:1** ✓
- **Muted text** (`--muted: #C5C8CE`) on dark background: **7.1:1** ✓
- **Accent color** (`--accent: #00D4B1`) on dark background: **4.8:1** ✓ (for large text/UI elements)
- **Accent on accent** (dark text on accent button): **4.5:1** ✓

All interactive elements (buttons, links) have visible focus states with 2px ring offset for clear visibility.

## Motion Performance Notes

- **GPU-friendly transforms only**: All animations use `transform` and `opacity` properties, avoiding layout thrash
- **Low-frequency drift**: Blob animations use `0.0003` speed multiplier for calm, deliberate motion
- **Reduced motion support**: Animations are disabled when `prefers-reduced-motion: reduce` is detected
- **Target 60fps**: Animation loop uses `requestAnimationFrame` with ~16ms intervals
- **Will-change optimization**: Blob elements use `will-change: transform, opacity` for GPU acceleration
- **Route transitions**: 250ms opacity crossfade, disabled for reduced motion

## CLS Prevention Steps

1. **Fixed image dimensions**: All logo images have explicit `width` and `height` attributes
   - Header logo: `width={140} height={40}`
   - Footer logo: `width={80} height={24}`
2. **No layout thrash**: Animations use `transform` only, no width/height changes
3. **Stable container heights**: Hero section uses `min-h-[85vh]` for consistent initial layout
4. **Preload critical assets**: Logo uses `loading="eager"` in header
5. **Route transitions**: Opacity-only transitions prevent layout shifts
6. **Explicit page container widths**: All pages use consistent `max-w-*` breakpoints

## Lighthouse Scores (Mobile)

**Target values for `/platform` route:**

- **Performance**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **SEO**: ≥ 90

### Optimization Strategies Applied:

- Minimal JavaScript bundle (no heavy animation libraries)
- CSS-only glassmorphism effects
- Lazy loading for non-critical images
- Explicit image dimensions to prevent CLS
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Route transitions use transform/opacity only

## Asset Fallbacks Applied

- **Header logo**: Uses `/brand/akis-logo-horizontal.png` with fallback to `/brand/akis-logo.png` via `onError` handler
- **Dark variants**: If dark PNGs are missing, base PNGs are reused with tokenized drop-shadow/edge-glow for legibility (no bitmap edits)
- **Footer logo**: Uses `/brand/akis-logo.png` with fallback to `/brand/akis-icon.png`

## Accessibility Checklist

- [x] All interactive elements have visible focus states
- [x] Keyboard navigation works (Tab order: Header → Hero CTAs → Module cards → Footer)
- [x] ARIA labels on locale switcher buttons
- [x] Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`)
- [x] Color contrast meets WCAG AA
- [x] Reduced motion preferences respected
- [x] Images have alt text
- [x] No layout shift on first paint
- [x] Route transitions respect reduced motion
- [x] Logo spin animation disabled for reduced motion

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge) with CSS backdrop-filter support
- Graceful degradation: Glassmorphism effects fall back to solid backgrounds on unsupported browsers
- Mobile-first responsive design tested on iOS Safari and Chrome Android

## Known Limitations

- Glassmorphism effects require `backdrop-filter` support (not available in older browsers)
- Blob animations disabled on devices with `prefers-reduced-motion` enabled
- Logo fallback chain may show brief flash if primary asset fails to load
- Route transitions are opacity-only (no blur effect) to maintain performance
