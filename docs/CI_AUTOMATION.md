# CI Automation Guide

AKIS platformu için CI/CD otomasyon rehberi.

---

## Quick Start

```bash
# Tek komutla: test → PR → merge → cleanup
./scripts/akis-pr-autoflow.sh

# Dry run (değişiklik yapmadan göster)
./scripts/akis-pr-autoflow.sh --dry-run

# PR oluştur ama merge etme
./scripts/akis-pr-autoflow.sh --no-merge
```

---

## akis-pr-autoflow.sh

### Ne Yapar?

1. **Ön Kontroller**: git, gh CLI, pnpm, node, docker durumunu doğrular
2. **Güvenlik Kontrolü**: .env dosyalarının git'e eklenmediğini garanti eder
3. **Branch Yönetimi**: Feature branch oluşturur veya main'den rescue yapar
4. **Tam Doğrulama**:
   - MCP Gateway smoke test
   - Backend: typecheck, lint, unit/integration tests
   - Frontend: typecheck, lint, tests
   - UI smoke test (build veya E2E)
5. **PR Akışı**: Push → PR oluştur → CI bekle → Merge → Cleanup

### Seçenekler

| Flag | Açıklama |
|------|----------|
| `--dry-run` | Değişiklik yapmadan ne olacağını göster |
| `--no-merge` | PR oluştur, CI bekle, ama merge etme |
| `--skip-ui` | UI smoke testlerini atla (önerilmez) |
| `--skip-mcp` | MCP gateway testlerini atla |
| `-h, --help` | Yardım mesajını göster |

### Gereksinimler

| Araç | Kurulum |
|------|---------|
| Git | Sistem gereksinimi |
| GitHub CLI | `brew install gh && gh auth login` |
| pnpm | `npm install -g pnpm` |
| Node.js | 20+ gerekli |
| Docker | MCP testleri için (opsiyonel) |

### Güvenlik Garantileri

Script şunları garanti eder:
- `.env`, `.env.local`, `backend/.env` vb. asla commit edilmez
- Tüm env dosyaları .gitignore'da
- Push öncesi staged dosyalar kontrol edilir
- Hata durumunda net mesajlar

### Örnek Çıktı

```
╔═══════════════════════════════════════════════════════════════╗
║           AKIS PR AUTOFLOW - Automated Verification           ║
╚═══════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
  PHASE 1: Precondition Checks
═══════════════════════════════════════════════════════════════

[✓] Git repository detected
[✓] Remote 'origin' exists
[✓] GitHub CLI installed and authenticated
[✓] pnpm available
[✓] node available (v22.12.0)
[✓] Docker available and running
[✓] Working tree is clean

═══════════════════════════════════════════════════════════════
                     TEST SUMMARY
═══════════════════════════════════════════════════════════════
  ✓ MCP Gateway: PASS
  ✓ Backend tests: PASS
  ✓ Frontend tests: PASS
  ✓ UI build: PASS
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
                     FINAL STATUS
═══════════════════════════════════════════════════════════════
  Status: SUCCESS
  Merged PR: #42
  Current branch: main
  Latest commit: abc1234 chore: automated verification + MCP gateway V2
═══════════════════════════════════════════════════════════════
```

---

## GitHub Actions CI

### Mevcut Workflow

`.github/workflows/ci.yml` içinde backend ve frontend jobları:

```yaml
jobs:
  backend:
    - typecheck
    - lint
    - test (PostgreSQL 16 ile)
    
  frontend:
    - typecheck
    - lint  
    - test
```

### CI Bekleme Mantığı

`akis-pr-autoflow.sh` PR oluşturduktan sonra:
1. `gh pr checks` ile durumu kontrol eder
2. Her 15 saniyede bir poll yapar
3. Maksimum 10 dakika bekler
4. Tüm checkler yeşil olunca merge eder

### CI Hata Ayıklama

```bash
# PR durumunu görüntüle
gh pr checks 42

# CI loglarını gör
gh run list --limit 5
gh run view <run-id> --log
```

---

## Troubleshooting

### "GitHub CLI not authenticated"

```bash
gh auth login
# Browser ile giriş yap veya token gir
```

### "CI checks failed"

```bash
# Lokal testleri tekrar çalıştır
cd backend && pnpm typecheck && pnpm lint && NODE_ENV=test pnpm test
cd frontend && pnpm typecheck && pnpm lint && pnpm test
```

### "SECURITY: .env files would be committed"

```bash
# .gitignore kontrol et
cat .gitignore | grep ".env"

# Staged .env dosyalarını unstage et
git reset HEAD **/.env*
```

### MCP Gateway testleri başarısız

```bash
# Gateway durumunu kontrol et
docker compose -f docker-compose.mcp.yml ps

# Logları gör
docker compose -f docker-compose.mcp.yml logs

# Yeniden başlat
./scripts/mcp-down.sh && ./scripts/mcp-up.sh
```

---

## Best Practices

1. **Her zaman `--dry-run` ile başla** - İlk seferinde ne olacağını gör
2. **Branch'ta çalış** - main'de doğrudan commit yapma
3. **Küçük PR'lar** - ~300 LoC altında tut
4. **CI'ı izle** - Manuel merge öncesi yeşil olduğundan emin ol

---

## Referanslar

- [GitHub CLI Docs](https://cli.github.com/manual/)
- [AKIS Contributing Guide](../README.md)
- [MCP Gateway Setup](./GITHUB_MCP_SETUP.md)

