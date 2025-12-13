## Why

<!-- Explain the motivation and context for this change. What problem does it solve? What is the goal? -->

## What Changed

<!-- Provide a concise summary of changes. List key files/modules affected. -->

### Code Changes
- 
- 

### Documentation Changes
- 
- 

### Asset Changes
- 
- 

## Test Evidence

<!-- Provide evidence that changes work as intended. Include test results, screenshots, logs, or links to QA documentation. -->

### Static Checks
- [ ] `pnpm -r typecheck` ✅
- [ ] `pnpm -r lint` ✅
- [ ] `pnpm -r test` ✅
- [ ] `pnpm -r build` ✅

### Manual Verification
- [ ] UI smoke tests (if applicable)
- [ ] Browser testing (if applicable)
- [ ] Integration testing (if applicable)

### QA Documentation
<!-- Link to QA evidence doc if available -->
- QA Evidence: `docs/QA_EVIDENCE_*.md` (if applicable)

---

## Brand Asset PR Checklist

<!-- Use this section for brand/logo/asset-related PRs. Reference: docs/BRAND_GUIDE.md Section 12.2 -->

### Brand Guide Compliance
- [ ] Dosya adı ve uzantısı doğru mu? (`.svg` gerçekten SVG mi?)
- [ ] Aynı varlığın duplicate varyantı var mı?
- [ ] Dosya boyutu hedefleri sağlandı mı? (logo <20KB hedefi, veya known exception documented)
- [ ] UI tarafında logo kullanımı **sadece** `Logo` komponenti üzerinden mi?
- [ ] Public tarafta sadece favicon + OG/Twitter görselleri mi var?
- [ ] A11y: `alt="AKIS"` ve dekoratifte `alt=""` kuralı uygulandı mı?

### Phase 9.2 Acceptance (if applicable)
- [ ] Canonical asset tablosundaki **tüm** dosyalar repo'da mevcut (ve doğru klasörde)
- [ ] Orphaned/legacy asset'ler frontend build path'inden kaldırılmış
- [ ] Uygulama içinde logo referansları **tek kaynak**: `Logo` komponenti + `frontend/src/theme/brand.ts`
- [ ] `frontend/index.html` favicon + OG/Twitter meta tag'leri içeriyor
- [ ] High-Res Logo Rollout: canonical UI logo density varyantları (1x/2x/3x) mevcut ve `Logo` `srcset` ile wired

### Known Exceptions
<!-- Document any placeholder assets, file size exceptions, or follow-up items -->
- 

---

## Final Asset Replacement Note

<!-- For brand asset PRs: Document that final assets can be drop-in replacements -->

**Note:** Current brand assets are placeholders generated from existing sources. Final brand assets (when available from design team) can be **drop-in replacements** using the canonical filenames defined in `docs/BRAND_GUIDE.md`. No code changes are expected for asset swaps—simply replace the files in `frontend/src/assets/branding/` and `frontend/public/brand/` with optimized final assets matching the canonical names.

---

## Checklist

### Code Quality
- [ ] Lint/build green (`pnpm -r lint`, `pnpm -r build`)
- [ ] Tests pass (`pnpm -r test`)
- [ ] TypeScript typecheck passes (`pnpm -r typecheck`)
- [ ] No console errors or warnings introduced

### Documentation
- [ ] Code comments updated (if needed)
- [ ] README/docs updated (if needed)
- [ ] Migration notes updated (if applicable)
- [ ] QA evidence documented (if applicable)

### UI/UX (if applicable)
- [ ] Screenshots provided (before/after)
- [ ] Responsive behavior verified
- [ ] Accessibility verified (keyboard navigation, screen reader, alt text)
- [ ] Browser testing completed (Chrome, Firefox, Safari)

### Security & Performance (if applicable)
- [ ] No sensitive data committed
- [ ] Performance impact assessed
- [ ] Security implications reviewed

---

## Linked Issues

<!-- Link related issues -->
Closes #ISSUE_ID
Related to #ISSUE_ID

---

## Additional Notes

<!-- Any additional context, follow-up items, or notes for reviewers -->
