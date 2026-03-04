# Staging Env Snapshot Guardrails

## Kaynak Gerçeği

- Staging runtime env dosyası VM'de `/opt/akis/.env` konumunda bulunur.
- Bu dosya production benzeri secret'lar içerebilir ve asla commit edilmemelidir.

## Güvenli Yenileme Prosedürü

1. Dosyayı yalnızca SSH ile yerel gitignore edilmiş depolamaya alın:
   - `.secrets/staging.env.snapshot`
2. Kısıtlayıcı izinleri uygulayın:
   - dizin: `chmod 700 .secrets`
   - snapshot dosyası: `chmod 600 .secrets/staging.env.snapshot`
3. Yalnızca redakte edilmiş çıktı ile doğrulayın (değişken adları ve maskelemiş metadata, asla ham değerler).

## Kullanım Rehberi

- Snapshot, ops sorun giderme ve env parite kontrolleri için referans materyaldir.
- Yerel geliştirme varsayılan olarak ayrı yerel secret'ları tutmalıdır.
- Staging secret'larını takip edilen şablonlara veya commit edilen dosyalara kopyalamak yasaktır.

## Tag Temizleme Notu

Tarih: 2026-02-24

Temizlik sırasında kaldırılan geçici tag'ler:

- `snapshot-local-codex-docs-m2-closure-sync-2026-02-16-20260224-193858`
- `snapshot-local-feat-S0.5-platform-polish-20260224-193858`
- `snapshot-remote-codex-docs-m2-closure-sync-2026-02-16-20260224-193848`
- `snapshot/20251110-234031-main`
- `snapshot/20251111-004911-phase10-baseline`
- `snapshot/20251111-004929-phase10-baseline`
- `archive/pre-scope-cleanup-20260224-1821`
- `phase-8.1-obs+spa`
- `phase-9.1`
- `safe-merge-poc-7ad6f6a`
- `safe-pre-prune-d85b841`
