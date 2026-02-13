# Adalet, Şeffaflık ve Açıklanabilirlik

## 1. Kullanıcı algısı: "adil mi?" sorusu

Recommender sistemlerde adalet ve şeffaflık kullanıcı güvenini belirler; kullanıcıların "fairness" algısını inceleyen çalışmalar bunu gösterir.

**Kaynak:** Sonboli et al. (2021). "Fairness and Transparency in Recommendation."  
[ACM Digital Library](https://dl.acm.org/doi/fullHtml/10.1145/3450613.3456835) | [arXiv](https://arxiv.org/pdf/2103.08786)

### AKIS sonucu

- **UI:** "Bu eşleşme neden önerildi?" paneli — faktörler, ağırlıklar, itiraz butonu
- Kullanıcı tarafından algılanan adalet, teknik adaletten farklı olabilir; her ikisini de ölç

---

## 2. Explainable Recommendation: tasarım repertuarı

Explainable recommendation survey'leri, açıklama türlerini ve "neden işe yarar"ı sistematik anlatır.

**Kaynak:** Zhang et al. "Explainable Recommendation: A Survey and New Perspectives."  
[arXiv:1804.11192](https://arxiv.org/abs/1804.11192)

### AKIS sonucu: standart açıklama şeması

```json
{
  "top_factors": ["skill_match", "portfolio_relevance", "past_performance"],
  "missing_skills": ["React", "TypeScript"],
  "portfolio_evidence": ["project_x", "project_y"],
  "confidence": 0.87,
  "fairness_adjustment_applied": true
}
```

| Alan | Açıklama |
|------|----------|
| `top_factors` | Eşleşmeyi destekleyen ana faktörler |
| `missing_skills` | İş için eksik veya zayıf beceriler |
| `portfolio_evidence` | İlgili portfolio öğeleri |
| `confidence` | Model güven skoru |
| `fairness_adjustment_applied` | Exposure/fairness düzeltmesi uygulandı mı |

---

## 3. İki taraflı adalet: tekrar eden eşleşmelerde kritik

Two-sided fairness, arz tarafı "freelancer" ve talep tarafı "işveren" için eşzamanlı adaleti düşünür.

**Kaynak:** Sühr et al. (2019). Two-sided fairness for repeated matchings.  
[Asia Biega KDD 2019](https://asiabiega.github.io/papers/two_sided_fairness_for_matchings_kdd2019.pdf)

### AKIS sonucu

- "Yeni başlayan" freelancer'a görünürlük sağlayan **kontrollü keşif (exploration)** modülü
- Epsilon-greedy veya bandit tabanlı exploration: belirli oranda yeni/az görünen freelancer'lara slot aç
- İşveren tarafı: kalite garantisi; freelancer tarafı: fırsat eşitliği
