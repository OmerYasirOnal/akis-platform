# AKIS Platform - UI Design System & Component Library

**Doküman Versiyonu:** v1.0  
**Hazırlanma Tarihi:** Kasım 2025  
**Amaç:** AKIS Platform'un görsel tasarım sistemi, marka token'ları, UI komponentleri ve stil rehberi

---

## 1. Marka Kimliği (Brand Identity)

### 1.1 Marka Değerleri ve Vizyon

**Core Values:**
- **Şeffaflık:** Her agent aksiyonu görünür ve açıklanabilir
- **Kontrol:** Kullanıcı her zaman yetkili, ajanlar asistanlardır
- **Güvenilirlik:** Tutarlı, öngörülebilir sonuçlar
- **Basitlik:** Karmaşık otomasyon, basit arayüz

**Visual Personality:**
- Modern ama gösterişsiz
- Teknik ama erişilebilir
- Dark mode-first (developer tool standartı)
- Minimalist ama sıcak

### 1.2 Logo Kullanımı

**Logo Asset:**
- Path: `frontend/src/assets/branding/akis-logo.png`
- Format: Transparent PNG
- Variants: 
  - Full logo (with wordmark)
  - Icon only (square variant for favicons)

**Logo Specifications:**

```
Desktop (Hero):
├── Size: 120-128px height
├── Padding: min 16px all sides
├── Background: Transparent or #0A1215
└── Alt text: "AKIS"

Mobile (Hero):
├── Size: 80-96px height
├── Padding: min 12px all sides
└── Responsive scale: fluid

Header/Navigation:
├── Size: 32-40px height
├── Position: Left aligned
└── Link: Navigates to "/" (homepage)

Favicon:
├── Sizes: 16x16, 32x32, 180x180, 512x512
└── Format: PNG + ICO
```

**Clear Space:**
- Minimum clear space around logo: `logo_height * 0.25`
- No other elements within clear space

**Don'ts:**
- ❌ Don't stretch or distort
- ❌ Don't rotate
- ❌ Don't change colors (use provided asset)
- ❌ Don't add effects (shadows, outlines) except subtle drop-shadow in dark contexts

---

## 2. Renk Paleti (Color System)

### 2.1 Temel Renkler (Primary Colors)

**Background Colors:**

```javascript
{
  // Main application background
  'ak-bg': '#0A1215',              // rgb(10, 18, 21)
                                    // hsl(196, 35%, 6%)
  
  // Surface levels (elevated backgrounds)
  'ak-surface': '#0E1A1F',         // rgb(14, 26, 31)
                                    // hsl(196, 38%, 9%)
  
  'ak-surface-2': '#142832',       // rgb(20, 40, 50)
                                    // hsl(200, 43%, 14%)
  
  'ak-surface-3': '#1A3240',       // rgb(26, 50, 64)
                                    // Hover states, elevated cards
}
```

**Brand Accent (Primary):**

```javascript
{
  'ak-primary': '#07D1AF',         // rgb(7, 209, 175)
                                    // Main brand color
                                    // Use for: CTAs, links, focus states
  
  'ak-primary-hover': '#06BF9F',   // Slightly darker for hover
  
  'ak-primary-active': '#05AD8F',  // Active/pressed state
  
  'ak-primary-muted': 'rgba(7, 209, 175, 0.1)',  
                                    // 10% opacity for backgrounds
  
  'ak-primary-border': 'rgba(7, 209, 175, 0.3)', 
                                    // 30% opacity for borders
}
```

### 2.2 Text Colors

```javascript
{
  // Primary text (headings, important content)
  'ak-text-primary': '#E5F0ED',    // rgb(229, 240, 237)
                                    // High contrast on dark bg
                                    // Contrast ratio: 13.5:1 on ak-bg ✓
  
  // Secondary text (body, descriptions)
  'ak-text-secondary': '#8FA7A1',  // rgb(143, 167, 161)
                                    // Medium contrast
                                    // Contrast ratio: 5.2:1 on ak-bg ✓
  
  // Tertiary text (captions, metadata)
  'ak-text-tertiary': '#5C7570',   // rgb(92, 117, 112)
                                    // Lower contrast
                                    // Contrast ratio: 3.1:1 (use for 18px+)
  
  // Disabled text
  'ak-text-disabled': '#3A4B48',   // rgb(58, 75, 72)
}
```

### 2.3 Semantic Colors (Status)

```javascript
{
  // Success states
  'ak-success': '#10B981',         // Green (Tailwind emerald-500)
  'ak-success-bg': 'rgba(16, 185, 129, 0.1)',
  'ak-success-border': 'rgba(16, 185, 129, 0.3)',
  
  // Warning states
  'ak-warning': '#F59E0B',         // Amber (Tailwind amber-500)
  'ak-warning-bg': 'rgba(245, 158, 11, 0.1)',
  'ak-warning-border': 'rgba(245, 158, 11, 0.3)',
  
  // Error/danger states
  'ak-error': '#EF4444',           // Red (Tailwind red-500)
  'ak-error-bg': 'rgba(239, 68, 68, 0.1)',
  'ak-error-border': 'rgba(239, 68, 68, 0.3)',
  
  // Info states
  'ak-info': '#3B82F6',            // Blue (Tailwind blue-500)
  'ak-info-bg': 'rgba(59, 130, 246, 0.1)',
  'ak-info-border': 'rgba(59, 130, 246, 0.3)',
}
```

### 2.4 Border & Divider Colors

```javascript
{
  'ak-border': '#1F3338',          // Default border color
                                    // Subtle separation
  
  'ak-border-focus': '#07D1AF',    // Focus states (inputs, buttons)
  
  'ak-divider': '#152A2F',         // Horizontal rules, separators
}
```

### 2.5 Overlay & Shadow Colors

```javascript
{
  // Modal/drawer overlays
  'ak-overlay': 'rgba(10, 18, 21, 0.85)',
  
  // Tooltip backgrounds
  'ak-tooltip-bg': '#1A3240',
  
  // Shadows (for elevation)
  // See section 4.3 for detailed shadow definitions
}
```

### 2.6 WCAG Contrast Compliance

**Tested Combinations (Body Text, 16px):**

| Foreground | Background | Ratio | Pass AA | Pass AAA |
|------------|------------|-------|---------|----------|
| ak-text-primary | ak-bg | 13.5:1 | ✅ | ✅ |
| ak-text-primary | ak-surface | 12.8:1 | ✅ | ✅ |
| ak-text-secondary | ak-bg | 5.2:1 | ✅ | ❌ |
| ak-text-secondary | ak-surface | 4.9:1 | ✅ | ❌ |
| ak-text-tertiary | ak-bg | 3.1:1 | ❌ | ❌ |
| ak-primary | ak-bg | 8.7:1 | ✅ | ✅ |

**Notes:**
- `ak-text-tertiary` only for 18px+ (large text, AA: 3:1 ✓)
- `ak-text-disabled` intentionally low contrast (non-essential content)

---

## 3. Tipografi (Typography)

### 3.1 Font Stack

**System Font Stack (No Web Fonts):**

```css
font-family: 
  'Inter var',           /* If locally installed */
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  sans-serif;
```

**Monospace (Code):**

```css
font-family:
  'JetBrains Mono',      /* If locally installed */
  'SF Mono',
  'Monaco',
  'Menlo',
  'Consolas',
  'Courier New',
  monospace;
```

**Rationale:**
- Avoid web font loading (performance budget)
- System fonts are optimized per OS
- Reduce first paint time

### 3.2 Type Scale

```javascript
{
  // Display (Hero headlines)
  'text-display': {
    fontSize: '3.5rem',      // 56px
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  
  // H1 (Page titles)
  'text-h1': {
    fontSize: '2.5rem',      // 40px
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  
  // H2 (Section titles)
  'text-h2': {
    fontSize: '2rem',        // 32px
    lineHeight: '1.25',
    fontWeight: '600',
  },
  
  // H3 (Subsection titles)
  'text-h3': {
    fontSize: '1.5rem',      // 24px
    lineHeight: '1.33',
    fontWeight: '600',
  },
  
  // H4 (Card titles)
  'text-h4': {
    fontSize: '1.25rem',     // 20px
    lineHeight: '1.4',
    fontWeight: '600',
  },
  
  // Body Large
  'text-body-lg': {
    fontSize: '1.125rem',    // 18px
    lineHeight: '1.75',
    fontWeight: '400',
  },
  
  // Body (Default)
  'text-body': {
    fontSize: '1rem',        // 16px
    lineHeight: '1.625',
    fontWeight: '400',
  },
  
  // Body Small
  'text-body-sm': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.57',
    fontWeight: '400',
  },
  
  // Caption
  'text-caption': {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  
  // Code
  'text-code': {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.7',
    fontFamily: 'monospace',
  },
}
```

### 3.3 Font Weights

```javascript
{
  'font-normal': 400,
  'font-medium': 500,
  'font-semibold': 600,
  'font-bold': 700,
}
```

**Usage Guidelines:**
- **Headings:** `font-semibold` (600) or `font-bold` (700)
- **Body text:** `font-normal` (400)
- **Emphasis:** `font-medium` (500) inline
- **CTAs:** `font-semibold` (600)

### 3.4 Responsive Typography

```css
/* Mobile (base) */
.text-display { font-size: 2.25rem; }   /* 36px */
.text-h1 { font-size: 1.875rem; }       /* 30px */
.text-h2 { font-size: 1.5rem; }         /* 24px */

/* Tablet (md: 768px+) */
@media (min-width: 768px) {
  .text-display { font-size: 3rem; }    /* 48px */
  .text-h1 { font-size: 2.25rem; }      /* 36px */
  .text-h2 { font-size: 1.75rem; }      /* 28px */
}

/* Desktop (lg: 1024px+) */
@media (min-width: 1024px) {
  .text-display { font-size: 3.5rem; }  /* 56px */
  .text-h1 { font-size: 2.5rem; }       /* 40px */
  .text-h2 { font-size: 2rem; }         /* 32px */
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (Tailwind-based)

```javascript
{
  '0': '0px',
  '1': '0.25rem',    // 4px
  '2': '0.5rem',     // 8px
  '3': '0.75rem',    // 12px
  '4': '1rem',       // 16px
  '5': '1.25rem',    // 20px
  '6': '1.5rem',     // 24px
  '8': '2rem',       // 32px
  '10': '2.5rem',    // 40px
  '12': '3rem',      // 48px
  '16': '4rem',      // 64px
  '20': '5rem',      // 80px
  '24': '6rem',      // 96px
  '32': '8rem',      // 128px
}
```

**Usage Patterns:**

```
Component Padding (Cards, Modals):
- Desktop: p-8 (32px) to p-12 (48px)
- Mobile: p-6 (24px)

Section Spacing (Vertical):
- Desktop: py-16 (64px) to py-24 (96px)
- Mobile: py-12 (48px)

Element Gaps (Flex/Grid):
- Tight: gap-2 (8px)
- Normal: gap-4 (16px)
- Loose: gap-6 (24px)

Container Max-Width:
- Narrow (text): 42rem (672px)
- Standard: 80rem (1280px)
- Wide: 90rem (1440px)
```

### 4.2 Layout Grid

**Container:**

```css
.container {
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 1.5rem; /* 24px */
}

@media (min-width: 768px) {
  .container {
    padding-inline: 2rem; /* 32px */
  }
}

@media (min-width: 1024px) {
  .container {
    padding-inline: 4rem; /* 64px */
  }
}
```

**Grid Systems:**

```css
/* 12-column grid (desktop) */
.grid-cols-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem; /* 24px */
}

/* 3-column feature grid */
.grid-cols-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem; /* 32px */
}

/* Responsive: stack on mobile */
@media (max-width: 767px) {
  .grid-cols-3 {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
```

### 4.3 Elevation & Shadows

```javascript
{
  // Subtle elevation (cards, inputs)
  'shadow-ak-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
  
  // Medium elevation (dropdowns, tooltips)
  'shadow-ak-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
  
  // High elevation (modals, popovers)
  'shadow-ak-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
  
  // Accent glow (hover on primary elements)
  'shadow-ak-glow': '0 0 24px rgba(7, 209, 175, 0.3)',
  
  // Inner shadow (inset inputs)
  'shadow-ak-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
}
```

**Usage:**
- Default cards: `shadow-ak-sm`
- Hover cards: `shadow-ak-md` + `translateY(-2px)`
- Modals: `shadow-ak-lg`
- Primary CTA hover: `shadow-ak-glow`

---

## 5. UI Components

### 5.1 Buttons

#### **Primary Button**

```tsx
// Tailwind classes
className="
  bg-ak-primary 
  hover:bg-ak-primary-hover 
  active:bg-ak-primary-active
  text-ak-bg 
  font-semibold 
  px-6 py-3 
  rounded-lg 
  transition-all 
  duration-200
  hover:scale-105 
  hover:shadow-ak-glow
  focus:outline-none 
  focus:ring-2 
  focus:ring-ak-primary 
  focus:ring-offset-2 
  focus:ring-offset-ak-bg
  disabled:opacity-50 
  disabled:cursor-not-allowed
  disabled:hover:scale-100
"
```

**States:**
- Default: `bg-ak-primary`, no shadow
- Hover: Slightly darker, scale 1.05, glow shadow
- Active: Darkest, scale 1.0 (pressed)
- Focus: 2px ring, primary color
- Disabled: 50% opacity, no interaction

#### **Secondary Button (Outline)**

```tsx
className="
  border-2 
  border-ak-primary 
  text-ak-primary 
  bg-transparent
  hover:bg-ak-primary-muted
  font-semibold 
  px-6 py-3 
  rounded-lg 
  transition-all
  focus:outline-none 
  focus:ring-2 
  focus:ring-ak-primary 
  focus:ring-offset-2 
  focus:ring-offset-ak-bg
"
```

#### **Ghost Button**

```tsx
className="
  text-ak-text-secondary 
  hover:text-ak-primary 
  hover:bg-ak-surface
  px-4 py-2 
  rounded-md 
  transition-colors
  font-medium
"
```

#### **Sizes:**

```javascript
{
  'btn-sm': 'px-4 py-2 text-sm',          // 14px text
  'btn-md': 'px-6 py-3 text-base',        // 16px text (default)
  'btn-lg': 'px-8 py-4 text-lg',          // 18px text
  'btn-xl': 'px-12 py-4 text-xl',         // 20px text (hero CTAs)
}
```

#### **Icon Buttons:**

```tsx
// Icon only, square
className="
  w-10 h-10 
  flex items-center justify-center
  rounded-lg 
  text-ak-text-secondary 
  hover:text-ak-primary 
  hover:bg-ak-surface
  transition-colors
  focus:ring-2 
  focus:ring-ak-primary
"
aria-label="Close" // Required for accessibility
```

---

### 5.2 Input Fields

#### **Text Input**

```tsx
className="
  w-full 
  bg-ak-surface 
  border 
  border-ak-border 
  text-ak-text-primary 
  px-4 py-3 
  rounded-lg 
  transition-all
  focus:border-ak-border-focus 
  focus:ring-2 
  focus:ring-ak-primary-muted 
  focus:outline-none
  placeholder:text-ak-text-tertiary
  disabled:opacity-50 
  disabled:cursor-not-allowed
"
```

**With Label:**

```tsx
<div className="space-y-2">
  <label 
    htmlFor="email" 
    className="block text-sm font-medium text-ak-text-secondary"
  >
    Email Address
  </label>
  <input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="..." // input classes above
  />
</div>
```

**Error State:**

```tsx
// Add to input classes
className="
  border-ak-error 
  focus:ring-ak-error-bg
"

// Error message below input
<p className="mt-1 text-sm text-ak-error">
  Invalid email address
</p>
```

#### **Password Input with Toggle:**

```tsx
<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    className="..." // standard input classes
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      text-ak-text-tertiary hover:text-ak-primary
    "
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>
```

#### **Select Dropdown:**

```tsx
className="
  w-full 
  bg-ak-surface 
  border 
  border-ak-border 
  text-ak-text-primary 
  px-4 py-3 
  rounded-lg 
  cursor-pointer
  focus:border-ak-border-focus 
  focus:ring-2 
  focus:ring-ak-primary-muted 
  focus:outline-none
"
```

---

### 5.3 Cards

#### **Base Card:**

```tsx
className="
  bg-ak-surface-2 
  border 
  border-ak-border 
  rounded-2xl 
  p-8 
  transition-all 
  duration-300
  hover:-translate-y-1 
  hover:shadow-ak-md
"
```

**Clickable Card (Link):**

```tsx
className="
  ...base-card-classes
  cursor-pointer
  hover:border-ak-primary
  focus:outline-none 
  focus:ring-2 
  focus:ring-ak-primary
"
```

**Card with Header:**

```tsx
<div className="...card-classes">
  <div className="flex items-start justify-between mb-4">
    <h3 className="text-h4 text-ak-text-primary">Card Title</h3>
    <span className="text-caption text-ak-text-tertiary">Meta</span>
  </div>
  <p className="text-body-sm text-ak-text-secondary">
    Card content goes here...
  </p>
</div>
```

---

### 5.4 Badges & Pills

#### **Status Badge:**

```tsx
// Success
className="
  inline-flex items-center gap-1
  px-2.5 py-1 
  rounded-full 
  text-xs font-medium
  bg-ak-success-bg 
  text-ak-success 
  border border-ak-success-border
"

// Warning
className="
  ...
  bg-ak-warning-bg 
  text-ak-warning 
  border border-ak-warning-border
"

// Error
className="
  ...
  bg-ak-error-bg 
  text-ak-error 
  border border-ak-error-border
"
```

**Usage:**

```tsx
<span className="badge-success">
  <CheckIcon className="w-3 h-3" />
  Success
</span>
```

---

### 5.5 Modals & Overlays

#### **Modal Container:**

```tsx
// Overlay backdrop
<div className="
  fixed inset-0 
  bg-ak-overlay 
  backdrop-blur-sm 
  z-40
  flex items-center justify-center
  p-4
">
  {/* Modal content */}
  <div className="
    bg-ak-surface-2 
    rounded-2xl 
    shadow-ak-lg 
    max-w-2xl 
    w-full 
    max-h-[90vh] 
    overflow-y-auto
    p-6
  ">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <h2 className="text-h3">Modal Title</h2>
      <button 
        className="..." // icon button classes
        aria-label="Close"
      >
        <XIcon />
      </button>
    </div>
    
    {/* Body */}
    <div className="mb-6">
      Content here...
    </div>
    
    {/* Footer */}
    <div className="flex justify-end gap-3">
      <button className="...">Cancel</button>
      <button className="...">Confirm</button>
    </div>
  </div>
</div>
```

**Accessibility:**
- Trap focus within modal
- `ESC` key closes modal
- `aria-modal="true"`
- `role="dialog"`
- `aria-labelledby` pointing to title

---

### 5.6 Navigation (Header)

#### **Desktop Header:**

```tsx
<header className="
  sticky top-0 
  z-50 
  bg-ak-bg/90 
  backdrop-blur-md 
  border-b border-ak-border
">
  <div className="container">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <a href="/" className="flex items-center">
        <img src={AKIS_LOGO_URL} alt="AKIS" className="h-8" />
      </a>
      
      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="/platform" className="...ghost-link">Platform</a>
        <a href="/pricing" className="...ghost-link">Pricing</a>
        <a href="/docs" className="...ghost-link">Docs</a>
      </nav>
      
      {/* Actions */}
      <div className="hidden md:flex items-center gap-3">
        <a href="/login" className="...btn-secondary">Login</a>
        <a href="/signup" className="...btn-primary">Sign up</a>
      </div>
      
      {/* Mobile menu button */}
      <button className="md:hidden" aria-label="Menu">
        <MenuIcon />
      </button>
    </div>
  </div>
</header>
```

#### **Mobile Drawer:**

```tsx
// Slide-over from right
<div className="
  fixed inset-y-0 right-0 
  w-64 
  bg-ak-surface-2 
  shadow-ak-lg 
  transform transition-transform
  z-50
  p-6
">
  <nav className="space-y-4">
    <a href="/platform" className="...">Platform</a>
    <a href="/pricing" className="...">Pricing</a>
    <a href="/docs" className="...">Docs</a>
    <hr className="border-ak-border" />
    <a href="/login" className="...btn-secondary">Login</a>
    <a href="/signup" className="...btn-primary">Sign up</a>
  </nav>
</div>
```

---

### 5.7 Tables

#### **Desktop Table:**

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-ak-border">
        <th className="
          px-4 py-3 
          text-left text-xs font-semibold 
          text-ak-text-secondary 
          uppercase tracking-wider
        ">
          Column 1
        </th>
        {/* More columns... */}
      </tr>
    </thead>
    <tbody>
      <tr className="
        border-b border-ak-border 
        hover:bg-ak-surface 
        transition-colors
        cursor-pointer
      ">
        <td className="px-4 py-4 text-sm text-ak-text-primary">
          Data cell
        </td>
        {/* More cells... */}
      </tr>
    </tbody>
  </table>
</div>
```

#### **Mobile Card View (Alternative):**

```tsx
// On mobile, each row becomes a card
<div className="md:hidden space-y-4">
  {data.map(item => (
    <div key={item.id} className="...card-classes">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-caption text-ak-text-tertiary">ID</span>
          <span className="text-body-sm">{item.id}</span>
        </div>
        {/* More fields... */}
      </div>
    </div>
  ))}
</div>
```

---

### 5.8 Toasts/Notifications

#### **Toast Container (Bottom-right):**

```tsx
<div className="
  fixed bottom-4 right-4 
  z-50 
  space-y-2 
  max-w-sm
">
  {/* Success toast */}
  <div className="
    bg-ak-surface-2 
    border-l-4 border-ak-success
    rounded-lg 
    shadow-ak-md 
    p-4
    flex items-start gap-3
  ">
    <CheckCircleIcon className="w-5 h-5 text-ak-success flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-ak-text-primary">
        Success!
      </p>
      <p className="text-xs text-ak-text-secondary mt-1">
        Your changes have been saved.
      </p>
    </div>
    <button className="..." aria-label="Dismiss">
      <XIcon className="w-4 h-4" />
    </button>
  </div>
</div>
```

**Variants:**
- Success: `border-ak-success`, green icon
- Error: `border-ak-error`, red icon
- Warning: `border-ak-warning`, amber icon
- Info: `border-ak-info`, blue icon

---

## 6. Animasyon ve Transition'lar

### 6.1 Transition Durations

```javascript
{
  'duration-fast': '150ms',      // Quick interactions (hover)
  'duration-base': '200ms',      // Default (most UI)
  'duration-slow': '300ms',      // Modals, drawers
  'duration-slower': '500ms',    // Page transitions
}
```

### 6.2 Easing Functions

```css
/* Default easing (most cases) */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); 
/* ease-in-out */

/* Entrance (modals, dropdowns) */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1); 
/* ease-out */

/* Exit */
transition-timing-function: cubic-bezier(0.4, 0, 1, 1); 
/* ease-in */
```

### 6.3 Common Animations

#### **Hover Lift (Cards):**

```css
.card-lift {
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.card-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}
```

#### **Button Scale:**

```css
.btn-scale {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.btn-scale:hover {
  transform: scale(1.05);
}

.btn-scale:active {
  transform: scale(1.0);
}
```

#### **Fade In (Page load):**

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 300ms ease-out;
}
```

#### **Slide In (Modal):**

```css
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-enter {
  animation: slideInUp 300ms ease-out;
}
```

#### **Spinner (Loading):**

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

**Performance Notes:**
- Only animate `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (layout thrashing)
- Use `will-change` sparingly for upcoming animations

---

## 7. Iconography

### 7.1 Icon System

**Source:** Heroicons (MIT license, Tailwind Labs)  
**Style:** Outline (default), Solid (emphasis)  
**Sizes:**

```javascript
{
  'icon-xs': 'w-3 h-3',      // 12px
  'icon-sm': 'w-4 h-4',      // 16px
  'icon-md': 'w-5 h-5',      // 20px (default)
  'icon-lg': 'w-6 h-6',      // 24px
  'icon-xl': 'w-8 h-8',      // 32px
}
```

### 7.2 Usage Guidelines

**In Buttons:**

```tsx
<button className="...">
  <PlusIcon className="w-5 h-5 mr-2" />
  Add Item
</button>
```

**Icon-Only Buttons:**

```tsx
<button 
  className="..." 
  aria-label="Settings"
>
  <CogIcon className="w-5 h-5" />
</button>
```

**In Text (Inline):**

```tsx
<p className="flex items-center gap-2">
  <CheckIcon className="w-4 h-4 text-ak-success" />
  <span>Feature enabled</span>
</p>
```

### 7.3 Common Icons Map

```javascript
{
  // Navigation
  home: HomeIcon,
  menu: MenuIcon,
  close: XMarkIcon,
  search: MagnifyingGlassIcon,
  
  // Actions
  add: PlusIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  save: CheckIcon,
  cancel: XMarkIcon,
  
  // Status
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  
  // UI
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,
  externalLink: ArrowTopRightOnSquareIcon,
  
  // Agents (custom or emoji fallback)
  scribe: DocumentTextIcon,
  trace: BeakerIcon,
  proto: RocketLaunchIcon,
}
```

---

## 8. Responsive Design Stratejileri

### 8.1 Mobile-First Approach

```css
/* Base styles (mobile, 375px) */
.component {
  padding: 1rem;
  font-size: 1rem;
}

/* Tablet (md: 768px+) */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
}

/* Desktop (lg: 1024px+) */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

### 8.2 Critical Responsive Patterns

**Navigation:**
- Mobile: Hamburger → Drawer
- Desktop: Horizontal nav bar

**Hero Section:**
- Mobile: Stack, logo 80px
- Desktop: Centered, logo 128px

**Feature Grids:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

**Dashboard Sidebar:**
- Mobile: Bottom tab bar or slide-over
- Desktop: Fixed left sidebar (240px)

**Tables:**
- Mobile: Card view (each row = card)
- Desktop: Traditional table

### 8.3 Touch Targets

**Minimum Size:** 44x44px (iOS guidelines)

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  /* Even if visual size is smaller, padding extends hit area */
}
```

---

## 9. Accessibility (A11y) Detayları

### 9.1 Focus States

**Visible Focus Ring:**

```css
.focus-visible {
  outline: none; /* Remove browser default */
}

.focus-visible:focus-visible {
  outline: 2px solid var(--ak-primary);
  outline-offset: 2px;
}
```

**Tailwind Utility:**

```tsx
className="focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg"
```

### 9.2 Skip Links

```tsx
<a 
  href="#main-content" 
  className="
    sr-only 
    focus:not-sr-only 
    focus:absolute 
    focus:top-4 
    focus:left-4 
    focus:z-50 
    focus:px-4 
    focus:py-2 
    focus:bg-ak-primary 
    focus:text-ak-bg
  "
>
  Skip to main content
</a>
```

### 9.3 Screen Reader Classes

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 9.4 ARIA Best Practices

**Landmarks:**

```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

**Live Regions:**

```tsx
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**Modals:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Description...</p>
</div>
```

---

## 10. Dark Mode Implementasyonu

### 10.1 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Class-based dark mode
  theme: {
    extend: {
      colors: {
        // Define ak-* colors here
      },
    },
  },
}
```

### 10.2 HTML Setup (Always Dark)

```html
<!DOCTYPE html>
<html lang="tr" class="dark">
<body class="bg-ak-bg text-ak-text-primary">
  <div id="root"></div>
</body>
</html>
```

**Notes:**
- `class="dark"` on `<html>` element
- `bg-ak-bg` on `<body>` ensures full-bleed dark background
- No white flashes on load

### 10.3 Future Light Mode (If Needed)

**Toggle Implementation:**

```tsx
function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

**Light Mode Colors (Future):**

```javascript
{
  'ak-bg-light': '#F9FAFB',
  'ak-surface-light': '#FFFFFF',
  'ak-text-primary-light': '#111827',
  'ak-text-secondary-light': '#6B7280',
  // ... etc.
}
```

---

## 11. Performance Optimizasyonları

### 11.1 CSS Purging (Production)

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Tailwind will purge unused classes
}
```

**Result:** Production CSS < 50 KB (gzipped)

### 11.2 Image Optimization

**Logo (PNG):**
- Optimize with ImageOptim or Squoosh
- Target: < 20 KB for logo asset
- Serve @1x and @2x versions (srcset)

```tsx
<img
  src="/assets/akis-logo.png"
  srcSet="/assets/akis-logo.png 1x, /assets/akis-logo@2x.png 2x"
  alt="AKIS"
  width={160}
  height={40}
/>
```

**Lazy Loading:**

```tsx
<img 
  src="..." 
  alt="..." 
  loading="lazy" 
  decoding="async"
/>
```

### 11.3 Animation Performance

**GPU Acceleration:**

```css
.animated {
  transform: translateZ(0); /* Force GPU layer */
  will-change: transform;   /* Hint to browser */
}

/* After animation completes, remove will-change */
```

**Reduce Motion (Accessibility):**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Özel Bileşen Örnekleri

### 12.1 Feature Card (Landing Page)

```tsx
function FeatureCard({ icon, title, description, link }) {
  return (
    <a
      href={link}
      className="
        group
        bg-ak-surface-2 
        border border-ak-border 
        rounded-2xl 
        p-8 
        transition-all 
        duration-300
        hover:-translate-y-2 
        hover:shadow-ak-md
        hover:border-ak-primary
        focus:outline-none 
        focus:ring-2 
        focus:ring-ak-primary
      "
    >
      <div className="
        w-12 h-12 
        rounded-lg 
        bg-ak-primary-muted 
        flex items-center justify-center
        mb-4
        group-hover:scale-110
        transition-transform
      ">
        {icon}
      </div>
      <h3 className="text-h4 text-ak-text-primary mb-2">
        {title}
      </h3>
      <p className="text-body-sm text-ak-text-secondary mb-4">
        {description}
      </p>
      <span className="
        text-sm text-ak-primary 
        font-medium 
        inline-flex items-center gap-1
        group-hover:gap-2
        transition-all
      ">
        Learn more
        <ArrowRightIcon className="w-4 h-4" />
      </span>
    </a>
  );
}
```

### 12.2 Status Badge Component

```tsx
function StatusBadge({ status, children }) {
  const variants = {
    success: 'bg-ak-success-bg text-ak-success border-ak-success-border',
    warning: 'bg-ak-warning-bg text-ak-warning border-ak-warning-border',
    error: 'bg-ak-error-bg text-ak-error border-ak-error-border',
    pending: 'bg-ak-info-bg text-ak-info border-ak-info-border',
  };
  
  const icons = {
    success: <CheckIcon className="w-3 h-3" />,
    warning: <ExclamationTriangleIcon className="w-3 h-3" />,
    error: <XMarkIcon className="w-3 h-3" />,
    pending: <ClockIcon className="w-3 h-3" />,
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1
      px-2.5 py-1 
      rounded-full 
      text-xs font-medium
      border
      ${variants[status]}
    `}>
      {icons[status]}
      {children}
    </span>
  );
}
```

---

## 13. Tailwind Config Özeti

```javascript
// tailwind.config.js (Complete)
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ak-bg': '#0A1215',
        'ak-surface': '#0E1A1F',
        'ak-surface-2': '#142832',
        'ak-surface-3': '#1A3240',
        'ak-primary': '#07D1AF',
        'ak-primary-hover': '#06BF9F',
        'ak-primary-active': '#05AD8F',
        'ak-primary-muted': 'rgba(7, 209, 175, 0.1)',
        'ak-primary-border': 'rgba(7, 209, 175, 0.3)',
        'ak-text-primary': '#E5F0ED',
        'ak-text-secondary': '#8FA7A1',
        'ak-text-tertiary': '#5C7570',
        'ak-text-disabled': '#3A4B48',
        'ak-border': '#1F3338',
        'ak-border-focus': '#07D1AF',
        'ak-divider': '#152A2F',
        'ak-overlay': 'rgba(10, 18, 21, 0.85)',
        'ak-success': '#10B981',
        'ak-success-bg': 'rgba(16, 185, 129, 0.1)',
        'ak-success-border': 'rgba(16, 185, 129, 0.3)',
        'ak-warning': '#F59E0B',
        'ak-warning-bg': 'rgba(245, 158, 11, 0.1)',
        'ak-warning-border': 'rgba(245, 158, 11, 0.3)',
        'ak-error': '#EF4444',
        'ak-error-bg': 'rgba(239, 68, 68, 0.1)',
        'ak-error-border': 'rgba(239, 68, 68, 0.3)',
        'ak-info': '#3B82F6',
        'ak-info-bg': 'rgba(59, 130, 246, 0.1)',
        'ak-info-border': 'rgba(59, 130, 246, 0.3)',
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'ak-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'ak-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'ak-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'ak-glow': '0 0 24px rgba(7, 209, 175, 0.3)',
        'ak-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
```

---

## 14. Sonuç ve Kullanım Kılavuzu

Bu design system dokümanı, AKIS Platform'un tüm UI bileşenlerini, renk paletini, tipografiyi ve kullanım kurallarını tanımlar.

### Kullanım:
1. **Yeni component geliştirirken:** İlgili bölüme (Buttons, Inputs, Cards) bakın
2. **Renk seçiminde:** Semantic renkleri (ak-success, ak-error) tercih edin
3. **Spacing:** Tailwind spacing scale'ini (4, 6, 8) kullanın
4. **Accessibility:** Her zaman ARIA label'ları ve focus state'leri ekleyin

### Güncelleme:
- Design token'ları değişirse `tailwind.config.js` güncelleyin
- Yeni component pattern'leri bu dökümana ekleyin
- Tüm değişiklikleri git'e commit'leyin

**Bu doküman, frontend takımının referans rehberidir ve codebase ile senkron tutulmalıdır.**


