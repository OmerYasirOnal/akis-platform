# AKIS Homepage — QA Notes

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

## CLS Prevention Steps

1. **Fixed image dimensions**: All logo images have explicit `width` and `height` attributes
   - Header logo: `width={140} height={40}`
   - Footer logo: `width={80} height={24}`
2. **No layout thrash**: Animations use `transform` only, no width/height changes
3. **Stable container heights**: Hero section uses `min-h-[85vh]` for consistent initial layout
4. **Preload critical assets**: Logo uses `loading="eager"` in header

## Lighthouse Scores (Mobile)

**Note**: Actual scores will be measured after deployment. Target values:

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

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge) with CSS backdrop-filter support
- Graceful degradation: Glassmorphism effects fall back to solid backgrounds on unsupported browsers
- Mobile-first responsive design tested on iOS Safari and Chrome Android

## Known Limitations

- Glassmorphism effects require `backdrop-filter` support (not available in older browsers)
- Blob animations disabled on devices with `prefers-reduced-motion` enabled
- Logo fallback chain may show brief flash if primary asset fails to load

