# Motion Phase 10 Notes
- `VITE_MOTION_ENABLED=true` varsayılanı ile rota geçişleri açıktır; `.env.local` dosyanızda `false` yaparak kapatabilirsiniz.
- Sistem `prefers-reduced-motion` tercihi algılanır; açık ise tüm animasyonlar anında durur.
- Rota geçişleri `fade-slide` presetini kullanır (240ms, ease-out); gereksinim ≤6 KB gz JS bütçesine uyulmalıdır.
- Manuel test: macOS için `System Settings → Accessibility → Display → Reduce motion` seçeneğini açıp kapanış davranışını doğrulayın.
- Performans: Chrome Performance panelinde route geçişi yakalayıp main-thread <8ms kare süresini ve layout thrash olmadığını doğrulayın.
- E2E navigasyonu için `yarn dev` + `react-router` sayfa turları yeterlidir; ekstra build ayarı gerekmez.
- Yeni efektler eklerken mevcut presetleri genişletin, var olan exportları değiştirmeyin.

