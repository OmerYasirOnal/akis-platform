# Public Portfolio Deposu — Oluşturma Kontrol Listesi

> Public `akis-platform-portfolio` deposunu oluşturmak ve sürdürmek için adım adım kılavuz.

## Ön Koşullar

- [ ] `docs/public/assets/` içinde [`SHOTLIST.md`](assets/SHOTLIST.md)'ye göre ekran görüntüleri var
- [ ] `docs/PUBLIC_PORTFOLIO.md` (TR) ve `docs/PUBLIC_PORTFOLIO_EN.md` (EN) güncel
- [ ] Main branch temiz (`git status` ile uncommitted değişiklik yok)

## Adım 1: Export Script'i Çalıştır

```bash
# devagents/ kök dizininden
./scripts/public-repo/export.sh
```

Bu komut:
1. `dist/public-repo/` dizinini izin listesindeki dosyalarla oluşturur
2. `README.md` (Türkçe) ve `README.en.md` (İngilizce) üretir
3. `LICENSE` (MIT) ve `SECURITY.md` ekler
4. Gizli bilgi/dahili detaylar için yasak listesi taraması yapar
5. Dışa aktarılan dosyaların özetini yazdırır

**Tarama başarısız olursa:** İşaretlenen dosyayı düzelt, tekrar çalıştır.

## Adım 2: Çıktıyı İncele

```bash
# Neyin export edildiğini kontrol et
find dist/public-repo -type f | head -50

# Dahili referanslar için birkaç dosyayı kontrol et
grep -r "192.168\|10.0\|172.1[6-9]" dist/public-repo/ || echo "Temiz"
grep -r "STAGING_HOST\|STAGING_SSH" dist/public-repo/ || echo "Temiz"
```

## Adım 3: Public Depoyu Oluştur

```bash
# Seçenek A: Export dizininden sıfırdan
cd dist/public-repo
git init
git add .
git commit -m "Initial commit — AKIS Platform portfolio showcase"
gh repo create OmerYasirOnal/akis-platform-portfolio --public \
  --description "Yazılım Geliştirme için AI Ajan Orkestrasyon Sistemi" \
  --source . --push
```

```bash
# Seçenek B: Mevcut repoya push et
cd dist/public-repo
git init
git remote add origin https://github.com/OmerYasirOnal/akis-platform-portfolio.git
git add .
git commit -m "Update portfolio snapshot"
git push -u origin main --force
```

## Adım 4: Ekran Görüntüsü Ekle

> **Not:** Cursor/AI ekran görüntüsü alamaz. Bu adım manuel yapılmalıdır.
> Tam liste: [`docs/public/assets/SHOTLIST.md`](assets/SHOTLIST.md)

1. [staging.akisflow.com](https://staging.akisflow.com) adresini aç (viewport 1440×900)
2. `SHOTLIST.md`'deki 8 görüntüyü yakala (landing hero, capabilities, signup, login, dashboard, ajan konsolu, iş detayı, ajanlar hub)
3. PNG olarak (< 500KB) **private** depodaki `docs/public/assets/` dizinine kaydet
4. `./scripts/public-repo/export.sh` ile public snapshot'a dahil et
5. Güncellenmiş public depoyu push et

## Adım 5: Public Depoyu Doğrula

- [ ] `github.com/OmerYasirOnal/akis-platform-portfolio` adresinde README düzgün görünüyor
- [ ] Dil değiştirici çalışıyor (README.md ↔ README.en.md)
- [ ] Hiçbir dosyada `.env`, gizli bilgi veya dahili IP görünmüyor
- [ ] `staging.akisflow.com` bağlantıları çalışıyor
- [ ] "About" bölümünde açıklama + website URL + etiketler var

### Önerilen GitHub Etiketleri
`ai`, `agent`, `orchestration`, `typescript`, `react`, `fastify`, `mcp`, `devtools`, `automation`, `thesis`

## Public Depoyu Güncelleme

Private depoda anlamlı değişiklikler olduğunda:

```bash
# 1. docs/PUBLIC_PORTFOLIO.md ve docs/PUBLIC_PORTFOLIO_EN.md güncelle
# 2. Export'u tekrar çalıştır
./scripts/public-repo/export.sh
# 3. Güncellenmiş snapshot'ı push et
cd dist/public-repo
git add . && git commit -m "Update snapshot — <ne değişti>"
git push
```

**Kural:** Public depodaki dosyaları asla manuel düzenleme. Her zaman private → public export et.
