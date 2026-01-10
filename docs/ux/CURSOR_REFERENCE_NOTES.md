# Cursor Design Reference Notes

**Version:** 1.0  
**Created:** 2026-01-10  
**Purpose:** Extract design patterns from Cursor's visual language and map to AKIS equivalents

---

## 1. Design Grammar Extraction

This document captures the visual patterns observed in Cursor's web presence and translates them into AKIS-appropriate implementations.

### 1.1 Overall Visual Language

| Aspect | Cursor Pattern | AKIS Adaptation |
|--------|----------------|-----------------|
| **Theme** | Dark-first, high contrast | Dark-first with AKIS teal accents |
| **Typography** | Clean sans-serif, generous spacing | System fonts, tight letter-spacing on headlines |
| **Color Palette** | Purple/blue gradients, white text | Teal (#07D1AF) accent, white/gray text hierarchy |
| **Surfaces** | Subtle gradients, soft borders | Glass morphism with ak-surface tokens |
| **Motion** | Minimal, purposeful | Subtle glow, reduced-motion aware |

---

## 2. Pattern Mapping

### 2.1 Hero Section

**Cursor Pattern:**
- Large centered logo
- Bold headline with gradient text (optional)
- Concise subtitle
- Primary + secondary CTA buttons
- Trust signals / social proof strip

**AKIS Equivalent:**
- AKIS logo (112px hero size)
- Headline: "Software Development's New Center"
- Subtitle: Agent value proposition
- CTAs: "Get Early Access" + "Already with AKIS?"
- Trust logos strip (placeholder)

**Component:** `frontend/src/components/Hero.tsx` (existing, enhance)

### 2.2 Navigation Header

**Cursor Pattern:**
- Logo left-aligned
- Horizontal nav links (center or right)
- CTA buttons right-aligned
- Frosted glass effect on scroll
- Mobile: hamburger menu

**AKIS Equivalent:**
- AKIS logo (24px nav size)
- Links: Platform, Docs, Pricing, Contact, About
- CTAs: Login, Sign Up
- Glass blur on scroll (`backdrop-blur-xl`)
- Mobile drawer pattern

**Component:** `frontend/src/components/Header.tsx` (existing)

### 2.3 Dashboard Sidebar

**Cursor Pattern:**
- Fixed left sidebar (~280px)
- Workspace/user info at top
- Grouped navigation sections
- Active state: subtle background highlight
- Collapse to icon-only on tablet (optional)

**AKIS Equivalent:**
- 72px sidebar (w-72 = 288px)
- Workspace label + user email
- Groups: Main, Agents, Settings
- Active: `bg-ak-surface-2`
- Mobile: slide-over drawer

**Component:** `frontend/src/components/layout/DashboardSidebar.tsx` (new)

### 2.4 Card System

**Cursor Pattern:**
- Rounded corners (16-24px)
- Subtle border
- Soft shadow
- Hover: lift + shadow increase
- Internal padding: 24-32px

**AKIS Equivalent:**
- `rounded-2xl` (24px)
- `border border-ak-border`
- `shadow-lg`
- Hover: `-translate-y-1 shadow-xl`
- `p-6` to `p-8`

**Component:** `frontend/src/components/common/Card.tsx` (existing)

### 2.5 Pricing Cards

**Cursor Pattern:**
- 3-tier horizontal layout (desktop)
- Stacked on mobile
- Highlight "recommended" tier
- Feature list with checkmarks
- Price prominent
- CTA at bottom

**AKIS Equivalent:**
- Developer (Free) / Team ($49) / Enterprise (Custom)
- Middle card highlighted with accent border
- Feature comparison list
- CTAs: "Start Free", "Start Trial", "Contact Sales"

**Component:** `frontend/src/pages/public/PricingPage.tsx` (new)

### 2.6 Settings Pages

**Cursor Pattern:**
- Tabbed or section-based layout
- Form cards for each setting group
- Inline validation
- Save/cancel actions per section

**AKIS Equivalent:**
- Sidebar sub-navigation (Profile, Workspace, AI Keys, etc.)
- Card per setting section
- Real-time validation
- Per-field save or section save

**Component:** `frontend/src/pages/dashboard/settings/` (existing structure)

### 2.7 Footer

**Cursor Pattern:**
- Multi-column grid (4 columns)
- Logo + copyright at bottom
- Social icons
- Link categories: Product, Resources, Company, Legal

**AKIS Equivalent:**
- Same 4-column structure
- AKIS logo
- GitHub, Twitter/X, LinkedIn icons
- Matching categories

**Component:** `frontend/src/components/Footer.tsx` (existing)

---

## 3. AKIS Page Mapping

| Cursor Page | AKIS Equivalent | Route | Status |
|-------------|-----------------|-------|--------|
| Homepage | Landing Page | `/` | Existing, enhance |
| Pricing | Pricing Page | `/pricing` | New |
| Blog | Blog Index | `/blog` | New (placeholder) |
| Docs | Docs Landing | `/docs` | New |
| Changelog | Changelog | `/changelog` | Future |
| Dashboard | Dashboard Overview | `/dashboard` | Existing, enhance |
| Settings | Settings Pages | `/dashboard/settings/*` | Existing, enhance |
| API Keys | AI Keys | `/dashboard/settings/ai-keys` | Existing, enhance |

---

## 4. Do-Not-Copy Checklist

### 4.1 Prohibited Elements

- [ ] **Text Content:** Do not copy any Cursor marketing copy, taglines, or descriptions
- [ ] **Brand Assets:** Do not use Cursor logo, favicon, or brand marks
- [ ] **Exact Layouts:** Do not pixel-mirror specific Cursor layouts
- [ ] **Color Values:** Do not copy Cursor's exact purple/blue gradient values
- [ ] **Typography:** Do not use Cursor's specific font choices if proprietary
- [ ] **Images:** Do not use any Cursor screenshots, illustrations, or photos
- [ ] **Code Snippets:** Do not copy Cursor's example code from their docs

### 4.2 Acceptable Inspirations

- [x] **Layout Patterns:** Sidebar + content structure is a common pattern
- [x] **Navigation Grouping:** Organizing nav into logical sections
- [x] **Card-Based Design:** Universal UI pattern
- [x] **Dark Theme:** Common for developer tools
- [x] **Frosted Glass:** Widely used glassmorphism effect
- [x] **Pricing Tiers:** Standard SaaS pricing structure
- [x] **Footer Columns:** Common footer organization

### 4.3 AKIS Differentiators

| Aspect | Cursor | AKIS Differentiation |
|--------|--------|----------------------|
| Primary Accent | Purple/Blue | Teal (#07D1AF) |
| Background | Dark gray | Deep dark (#0A1215) |
| Visual Effect | Subtle gradients | Liquid Neon blobs |
| Product Focus | Code editor | AI agent platform |
| Messaging | "The AI Code Editor" | "Software Development's New Center" |
| Agent Names | N/A | Scribe, Trace, Proto |

---

## 5. Component Implementation Notes

### 5.1 Spacing Guidelines

Extracted from Cursor patterns:

```
Hero vertical padding: 96px-128px
Section vertical padding: 64px-96px
Card internal padding: 24px-32px
Card gap in grid: 24px-32px
Nav item horizontal padding: 16px
Nav item vertical padding: 8px
```

### 5.2 Border Radius Scale

```
Small elements (badges, pills): 9999px (full round)
Buttons: 9999px (pill shape)
Cards: 24px (rounded-2xl)
Input fields: 12px (rounded-xl)
Large sections: 32px (rounded-3xl)
```

### 5.3 Shadow Scale

```
Default cards: 0 4px 16px rgba(0,0,0,0.5)
Hover cards: 0 8px 32px rgba(0,0,0,0.6)
Modals: 0 16px 48px rgba(0,0,0,0.7)
Glow effect: 0 0 24px rgba(accent,0.3)
```

---

## 6. Responsive Breakpoints

Matching AKIS existing system (Tailwind defaults):

| Breakpoint | Width | Layout |
|------------|-------|--------|
| `base` | < 640px | Mobile - stacked layout |
| `sm` | 640px+ | Tablet portrait |
| `md` | 768px+ | Tablet landscape |
| `lg` | 1024px+ | Desktop - sidebar visible |
| `xl` | 1280px+ | Wide desktop |
| `2xl` | 1536px+ | Ultra-wide |

---

## 7. Animation Guidelines

Based on Cursor's subtle approach:

### 7.1 Transition Durations

```css
--transition-fast: 150ms;    /* Hover states */
--transition-base: 200ms;    /* Default interactions */
--transition-slow: 300ms;    /* Modal/drawer open */
--transition-slower: 500ms;  /* Page transitions */
```

### 7.2 Easing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* ease-in-out */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Enter animations */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Exit animations */
```

### 7.3 Motion Principles

- Animations enhance, not distract
- Maximum animation duration: 500ms
- No looping animations in main content area
- Background animations: very slow (10-20s cycles), very subtle
- Always respect `prefers-reduced-motion`

---

## 8. Accessibility Alignment

Cursor demonstrates good accessibility practices that AKIS should match:

- High contrast text (15:1+ on dark backgrounds)
- Visible focus indicators
- Keyboard navigable
- Semantic HTML structure
- ARIA labels for interactive elements
- Screen reader friendly

---

*This document serves as a reference for implementing Cursor-inspired patterns while maintaining AKIS's unique brand identity.*
