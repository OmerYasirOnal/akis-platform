# Matching Mekanizmaları: Teori ve AKIS Tasarım Sonuçları

## 1. Matching’in "klasik" temeli: Stabilite

Gale–Shapley algoritması, tercih listeleriyle **stabil eşleşme** üretir; bu, "itiraz/kaçış" (blocking pair) riskini teorik olarak azaltır.

**Kaynak:** Gale, D. & Shapley, L. S. (1962). "College Admissions and the Stability of Marriage."  
[Math at Washington](https://sites.math.washington.edu/~billey/classes/562.winter.2018/articles/Gale.Shapley.pdf)

### AKIS sonucu

Kurumsal paketlerde (özellikle tekrarlı eşleşme) "stabilite" kavramını bir **opsiyonel mod** olarak sun:

```yaml
matching_mode: score_only | stable_matching | hybrid
```

- `score_only`: Sadece skor tabanlı sıralama
- `stable_matching`: Gale-Shapley benzeri stabil eşleşme (tercih listeleri gerekli)
- `hybrid`: Skor + stabilite kombinasyonu

---

## 2. Modern platform gerçeği: Repeated Matching + İki taraflı adalet

Ride-hailing gibi sistemlerde aynı taraflar defalarca eşleşir; burada sadece "anlık skor" değil, zaman içinde **gelir/fırsat dağılımı** önemlidir.

**Kaynak:** Sühr et al. (2019). "Two-Sided Fairness for Repeated Matchings: A Case Study of a Ride-Hailing Platform."  
[Asia Biega KDD 2019](https://asiabiega.github.io/papers/two_sided_fairness_for_matchings_kdd2019.pdf)

### AKIS sonucu

- `fairness_budget` ve `exposure_balance` kavramlarıyla "sürekli kazananların" tekelleşmesini kır
- Match skoruna ek olarak `exposure_score` sakla (kim ne kadar görünürlük aldı)
- Zaman penceresi bazlı adalet metrikleri (örn. son 30 günde exposure dağılımı)

---

## 3. "Two-sided market" perspektifi (işveren + freelancer)

Platform ekonomisi iki taraflı pazar dinamikleriyle ele alınır; fiyatlandırma/komisyon ve refah etkileri buradan okunur.

**Kaynak:** OECD. "Regulating platform work in the digital age."  
[OECD](https://www.oecd.org/en/publications/regulating-platform-work-in-the-digital-age_181f8a7f-en.html)

### AKIS sonucu

- **Talep tarafı (işveren):** Friksiyonu azalt — hızlı eşleşme, kaliteli öneri, düşük arama maliyeti
- **Arz tarafı (freelancer):** Kalite/rozet/kanıt ile görünürlük artır — skill graph, portfolio, sertifikalar
- Komisyon + abonelik modelini tasarlarken her iki tarafın refahını gözet
