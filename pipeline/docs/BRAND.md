# AKIS Brand Reference — Pipeline Development

Source: `docs/UI_DESIGN_SYSTEM.md` (full reference)

## Brand Values

- Transparency: Every agent action visible and explainable
- Control: User always in charge, agents are assistants
- Reliability: Consistent, predictable results
- Simplicity: Complex automation, simple interface

## Visual Personality

- Modern but understated
- Technical but accessible
- Dark mode-first (developer tool standard)
- Minimalist but warm
- Liquid-glass / frosted surfaces aesthetic

## Color Palette (Dark Theme — Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `ak-bg` | `#0A1215` | Site background, body/html |
| `ak-surface` | `#0D171B` | Low elevation (banner, ribbon) |
| `ak-surface-2` | `#122027` | Cards, modals, auth forms |
| `ak-primary` | `#07D1AF` | CTA, links, focus ring (teal accent) |
| `ak-text-primary` | `#E9F1F3` | Headings and critical text |
| `ak-text-secondary` | `#A9B6BB` | Body descriptions |
| `ak-border` | `#1A262C` | Card/section borders, dividers |
| `ak-danger` | `#FF6B6B` | Error states |

## Color Palette (Light Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `ak-bg-light` | `#ffffff` | Body background |
| `ak-surface-light` | `#ffffff` | Low elevation |
| `ak-surface-2-light` | `#f6f8fa` | Cards, modals |
| `ak-surface-3-light` | `#eaeef2` | Subtle surfaces |
| `ak-text-primary-light` | `#1f2328` | Headings and critical text |
| `ak-text-secondary-light` | `#656d76` | Body descriptions |
| `ak-border-light` | `#d0d7de` | Card/section borders |

Primary (`#07D1AF`) does not change between themes.

## Logo

- Primary: `frontend/src/assets/branding/akis-official-logo@2x.png`
- Mark-only: `frontend/src/assets/branding/akis-a-mark.png`, `akis-mark@2x.png`
- Config: `frontend/src/theme/brand.ts` (`LOGO_PNG_HERO`, `LOGO_SIZES`)
- Sizes: Hero 112px, Nav 24px, Footer 20px, Favicon 16/32/180/512px
- Clear space: `logo_height * 0.25`

## Typography

- Font: Inter (system fallback stack)
- Token source: `frontend/src/theme/tokens.ts`

## Glassmorphism Tokens

- Glass tokens: `--glass-top`, `--glass-mid`, `--glass-bdr`
- Edge glow: `rgba(0, 212, 177, 0.35)` (primary accent glow)
- Border radius: 16-32px
- Transitions: 200ms base, 350ms smooth

## Card Pattern

```
bg-ak-surface-2 border border-ak-border text-ak-text-primary
hover:-translate-y-1 hover:shadow-lg
```

## Shadows

- `shadow-ak-sm`, `shadow-ak-md`, `shadow-ak-lg`: Elevation
- `shadow-ak-glow`, `shadow-ak-glow-sm`, `shadow-ak-glow-lg`: Accent glow

## CSS Token Files

- `frontend/src/styles/global.css` — Theme definitions
- `frontend/src/styles/tokens.css` — Glass morphism variables
- `frontend/src/theme/tokens.ts` — Type-safe token exports
- `frontend/tailwind.config.js` — Tailwind integration

## WCAG AA Compliance

| Foreground | Background | Ratio |
|------------|------------|-------|
| ak-text-primary | ak-bg | 15.2:1 |
| ak-text-secondary | ak-bg | 7.1:1 |
| ak-primary | ak-bg | 4.8:1 |
| ak-danger | ak-surface-2 | 4.6:1 |

## Rules

- NEVER change the teal accent (#07D1AF)
- NEVER use pure white backgrounds in dark theme
- ALWAYS use `ak-*` tokens, not hardcoded colors
- Preserve glass morphism: `backdrop-blur-sm`, `bg-white/[0.03]`, `border-white/[0.06]`
