# AKIS Liquid Neon Visual Layer Specification

**Version:** 1.0  
**Created:** 2026-01-10  
**Purpose:** Define the AKIS-branded visual layer that overlays the Cursor-like structure

---

## 1. Overview

The "Liquid Neon" layer is AKIS's distinctive visual identity element that differentiates it from generic dark-theme dashboards. It consists of animated, blurred gradient blobs that create a subtle, premium atmosphere without impacting performance or accessibility.

### Design Principles

1. **Subtle, not flashy** — Effects should enhance, not distract
2. **Performance-first** — CSS-only, GPU-accelerated, no jank
3. **Accessible** — Respects reduced-motion preferences
4. **On-brand** — Uses AKIS teal (#07D1AF) as the accent color
5. **Optional** — Can be disabled globally or per-component

---

## 2. Color Specification

### 2.1 Primary Accent Color

| Property | Value | Usage |
|----------|-------|-------|
| AKIS Teal | `#07D1AF` | Primary glow, accent borders, CTA buttons |
| AKIS Teal @50% | `rgba(7, 209, 175, 0.5)` | Medium intensity glow |
| AKIS Teal @25% | `rgba(7, 209, 175, 0.25)` | Subtle glow |
| AKIS Teal @12% | `rgba(7, 209, 175, 0.12)` | Background blobs |
| AKIS Teal @8% | `rgba(7, 209, 175, 0.08)` | Very subtle tints |

### 2.2 Background Colors (Existing)

| Token | Value | Usage |
|-------|-------|-------|
| `ak-bg` | `#0A1215` | Page background |
| `ak-surface` | `#0D171B` | Low elevation surfaces |
| `ak-surface-2` | `#122027` | Cards, modals |

### 2.3 Glow Variations

For variety without introducing new brand colors:

| Variation | Color | Opacity | Usage |
|-----------|-------|---------|-------|
| Primary Glow | `#07D1AF` | 20-30% | Main accent blobs |
| Soft Glow | `#07D1AF` | 10-15% | Secondary blobs |
| Edge Glow | `#07D1AF` | 5-8% | Distant/ambient blobs |

---

## 3. Background Blob Specification

### 3.1 Blob Configuration

The liquid background consists of 4-5 blurred circular gradient elements:

| Blob | Size | Position | Blur | Opacity | Animation |
|------|------|----------|------|---------|-----------|
| Blob 1 | 384px | Top-left | 40px | 0.15-0.20 | Drift A |
| Blob 2 | 320px | Top-right | 32px | 0.12-0.18 | Drift B |
| Blob 3 | 288px | Bottom-center | 36px | 0.15-0.22 | Drift C |
| Blob 4 | 256px | Mid-left | 28px | 0.10-0.15 | Drift D |
| Blob 5 | 224px | Bottom-right | 28px | 0.08-0.12 | Drift E |

### 3.2 CSS Implementation

```css
.liquid-blob {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at center,
    rgba(7, 209, 175, 0.15) 0%,
    rgba(7, 209, 175, 0.05) 50%,
    transparent 100%
  );
  filter: blur(var(--blur-amount, 36px));
  opacity: var(--blob-opacity, 0.15);
  will-change: transform, opacity;
  pointer-events: none;
}
```

### 3.3 Animation Keyframes

**Drift Pattern A (Primary blob):**
```css
@keyframes driftA {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.15;
  }
  25% {
    transform: translate(20px, -15px) scale(1.05);
    opacity: 0.18;
  }
  50% {
    transform: translate(-10px, 10px) scale(0.95);
    opacity: 0.12;
  }
  75% {
    transform: translate(15px, 20px) scale(1.02);
    opacity: 0.16;
  }
}

.blob-drift-a {
  animation: driftA 20s ease-in-out infinite;
}
```

**Drift Pattern B (Secondary blob):**
```css
@keyframes driftB {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.12;
  }
  33% {
    transform: translate(-25px, 10px) scale(1.08);
    opacity: 0.15;
  }
  66% {
    transform: translate(15px, -20px) scale(0.92);
    opacity: 0.10;
  }
}

.blob-drift-b {
  animation: driftB 25s ease-in-out infinite;
  animation-delay: -5s;
}
```

---

## 4. Button Glow Effects

### 4.1 Primary Button Glow

```css
.btn-primary-glow {
  box-shadow: 
    0 0 0 1px rgba(7, 209, 175, 0.3),
    0 4px 16px rgba(7, 209, 175, 0.2);
  transition: box-shadow 200ms ease;
}

.btn-primary-glow:hover {
  box-shadow: 
    0 0 0 1px rgba(7, 209, 175, 0.5),
    0 8px 24px rgba(7, 209, 175, 0.3);
}

.btn-primary-glow:focus-visible {
  box-shadow: 
    0 0 0 2px var(--ak-bg),
    0 0 0 4px rgba(7, 209, 175, 0.8);
}
```

### 4.2 Card Hover Glow

```css
.card-glow:hover {
  border-color: rgba(7, 209, 175, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 16px rgba(7, 209, 175, 0.1);
}
```

---

## 5. Typography Enhancement

### 5.1 No Mandatory External Fonts

The Liquid Neon layer does not require external font downloads. Use the existing system font stack:

```css
font-family: 
  'Inter var',
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

### 5.2 Type Scale Refinements

For the premium visual feel:

| Element | Letter-Spacing | Line-Height | Weight |
|---------|---------------|-------------|--------|
| Display (Hero) | -0.02em | 1.1 | 700 |
| H1 | -0.01em | 1.2 | 700 |
| H2 | 0 | 1.25 | 600 |
| H3 | 0 | 1.33 | 600 |
| Body | 0 | 1.625 | 400 |
| Caption | 0.01em | 1.5 | 400 |

### 5.3 Text Glow (Sparingly)

For hero headlines only:

```css
.text-glow {
  text-shadow: 0 0 40px rgba(7, 209, 175, 0.3);
}
```

**Usage:** Hero headline only. Do not apply to body text or navigation.

---

## 6. Performance Constraints

### 6.1 OCI Free Tier Compatibility

| Constraint | Limit | Implementation |
|------------|-------|----------------|
| CPU Usage | Low | CSS-only animations (no JS animation frames) |
| Memory | Minimal | No canvas, WebGL, or large image assets |
| GPU | Light | Only `transform` and `opacity` animated |
| Network | None | No external resources for effects |

### 6.2 Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Animation Frame Budget | < 16ms | Chrome DevTools |
| Paint Operations | < 2 per frame | Layers panel |
| Composite Layers | <= 6 | Layers panel |
| Memory (effects) | < 5MB | Task Manager |

### 6.3 Optimization Techniques

1. **Use `will-change` sparingly:**
   ```css
   .liquid-blob {
     will-change: transform, opacity;
   }
   ```

2. **Promote to compositor layer:**
   ```css
   .liquid-blob {
     transform: translateZ(0);
   }
   ```

3. **Avoid triggering layout:**
   - Only animate `transform` and `opacity`
   - Never animate `width`, `height`, `top`, `left`, `margin`, `padding`

4. **Reduce blob count on mobile:**
   - Desktop: 5 blobs
   - Tablet: 3 blobs
   - Mobile: 2 blobs

---

## 7. Accessibility Requirements

### 7.1 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .liquid-blob {
    animation: none !important;
    opacity: 0.1 !important;
  }
  
  .btn-primary-glow,
  .card-glow {
    transition: none !important;
  }
}
```

### 7.2 Global Toggle

Provide a user-controllable toggle stored in localStorage:

```tsx
// ThemeContext or dedicated MotionContext
const [reducedMotion, setReducedMotion] = useState(() => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('akis-reduced-motion');
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

const toggleReducedMotion = () => {
  const newValue = !reducedMotion;
  setReducedMotion(newValue);
  localStorage.setItem('akis-reduced-motion', String(newValue));
};
```

### 7.3 Focus State Visibility

Ensure focus states are always visible over the liquid background:

```css
:focus-visible {
  outline: 2px solid #07D1AF;
  outline-offset: 2px;
}

/* High contrast focus for inputs */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  border-color: #07D1AF;
  box-shadow: 0 0 0 3px rgba(7, 209, 175, 0.3);
}
```

### 7.4 Contrast Compliance

Background blobs must not reduce text contrast below WCAG AA standards:

| Text Type | Minimum Contrast | With Blob | Pass? |
|-----------|-----------------|-----------|-------|
| Body text on ak-bg | 4.5:1 | 14.8:1 | Yes |
| Secondary text on ak-bg | 4.5:1 | 7.0:1 | Yes |
| Accent on ak-bg | 3:1 | 4.8:1 | Yes |

---

## 8. Component API

### 8.1 LiquidNeonBackground Component

```tsx
interface LiquidNeonBackgroundProps {
  /** Enable/disable the background. Default: true */
  enabled?: boolean;
  
  /** Intensity level. Default: 'subtle' */
  intensity?: 'subtle' | 'accent' | 'vibrant';
  
  /** Respect reduced motion preference. Default: true */
  respectReducedMotion?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

export function LiquidNeonBackground({
  enabled = true,
  intensity = 'subtle',
  respectReducedMotion = true,
  className,
}: LiquidNeonBackgroundProps);
```

### 8.2 Usage Example

```tsx
// In layout component
<div className="relative min-h-screen">
  <LiquidNeonBackground 
    enabled={!userPrefersReducedMotion}
    intensity="subtle"
  />
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

---

## 9. Design Tokens

### 9.1 New Tokens to Add

```css
:root {
  /* Glow tokens */
  --ak-glow-accent: 0 0 24px rgba(7, 209, 175, 0.25);
  --ak-glow-subtle: 0 0 16px rgba(7, 209, 175, 0.12);
  --ak-glow-edge: 0 0 40px rgba(7, 209, 175, 0.08);
  
  /* Motion tokens */
  --ak-motion-fast: 150ms;
  --ak-motion-base: 200ms;
  --ak-motion-slow: 300ms;
  --ak-motion-slower: 500ms;
  
  /* Easing tokens */
  --ak-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ak-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ak-ease-in: cubic-bezier(0.4, 0, 1, 1);
  
  /* Blur tokens */
  --ak-blur-backdrop: 16px;
  --ak-blur-card: 8px;
  --ak-blur-blob: 36px;
  
  /* Blob opacity tokens */
  --ak-blob-opacity-primary: 0.15;
  --ak-blob-opacity-secondary: 0.12;
  --ak-blob-opacity-ambient: 0.08;
}
```

### 9.2 Tailwind Extension

```javascript
// tailwind.config.js extend section
{
  boxShadow: {
    'ak-glow': '0 0 24px rgba(7, 209, 175, 0.25)',
    'ak-glow-sm': '0 0 16px rgba(7, 209, 175, 0.12)',
    'ak-glow-lg': '0 0 40px rgba(7, 209, 175, 0.3)',
  },
  transitionDuration: {
    'fast': '150ms',
    'base': '200ms',
    'slow': '300ms',
  },
  blur: {
    'blob': '36px',
  },
}
```

---

## 10. Implementation Checklist

- [ ] Add glow/motion/blur tokens to `theme.tokens.css`
- [ ] Add Tailwind extensions to `tailwind.config.js`
- [ ] Create `LiquidNeonBackground.tsx` component
- [ ] Add reduced-motion toggle to settings or theme context
- [ ] Update `AppShell.tsx` to include background
- [ ] Update `DashboardShell.tsx` to include background
- [ ] Test performance on low-spec device
- [ ] Verify WCAG contrast compliance
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Document usage in component library

---

*This specification ensures the Liquid Neon layer enhances AKIS's visual identity while maintaining performance and accessibility standards.*
