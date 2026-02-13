# AKIS Freelancer Marketplace — Araştırma Haritası

## Amaç

AKIS’in pazar yeri + entegrasyon + AI eşleştirme iddiasını, **3 bilimsel eksende** doğrulamak:

1. **Matching / Two-sided market mekanizmaları** (stability, repeated matching, iki taraflı adalet)
2. **Job/Candidate recommender & skills matching** (embedding, iki aşamalı retrieval→rerank)
3. **Algorithmic management, trust & governance** (şeffaflık, denetim, ölçüm, sosyal etkiler)

---

## "Karar soruları" (ürün)

| Soru | Alan |
|------|------|
| Eşleştirme: Sadece skorlamak mı, yoksa **stabilite** ve **iki taraflı adalet** de optimize edilecek mi? | Matching |
| Açıklanabilirlik: Her match için "neden bu kişi?" açıklaması **zorunlu** mı? | Explainability |
| Yönetim: Otomatik kararlar için "itiraz + insan denetimi" nasıl tasarlanacak? | Governance |

---

## Kaynak omurgası

| Konu | Kaynak | Referans |
|------|--------|----------|
| **Stabil Matching (Gale–Shapley)** | temel teori, stabilite garantisi | [Math at Washington][1] |
| **Repeated matchings + two-sided fairness** | ride-hailing case study ile pratik adalet çerçevesi | [Asia Biega][2] |
| **Explainable Recommendation** | açıklama formatları ve neden gerekli olduğu | [arXiv][3] |
| **Job matching at scale (CareerBuilder)** | embedding + ANN (Faiss benzeri) + reranking mimarisi | [IRS Workshop][4] |
| **Platform work / algorithmic management** | riskler, denetim ve insan-merkezli tasarım | [International Labour Organization][5] |

---

## Doküman yapısı

| Dosya | İçerik |
|-------|--------|
| `01_MATCHING_MECHANISMS.md` | Gale-Shapley, repeated matching, two-sided fairness, AKIS tasarım kararları |
| `02_JOB_RECSYS_AND_SKILLS_MATCHING.md` | 2 aşamalı retrieval→rerank, Skills2Job, e-recruiting survey |
| `03_FAIRNESS_TRANSPARENCY_EXPLAINABILITY.md` | Kullanıcı algısı, açıklama şeması, iki taraflı adalet |
| `04_PLATFORM_WORK_GOVERNANCE_AND_MEASUREMENT.md` | Algorithmic management, ILO/OECD çerçevesi, ölçüm metrikleri |
| `05_ANNOTATED_BIBLIOGRAPHY.md` | Çekirdek okuma listesi ve kısa açıklamalar |

---

[1]: https://sites.math.washington.edu/~billey/classes/562.winter.2018/articles/Gale.Shapley.pdf "College Admissions and the Stability of Marriage"
[2]: https://asiabiega.github.io/papers/two_sided_fairness_for_matchings_kdd2019.pdf "Two-Sided Fairness for Repeated Matchings: A Case Study of a Ride-Hailing Platform"
[3]: https://arxiv.org/abs/1804.11192 "Explainable Recommendation: A Survey and New Perspectives"
[4]: https://irsworkshop.github.io/2021/publications/IRS2021_paper_6.pdf "Embedding-based Recommender System for Job to Candidate Matching"
[5]: https://www.ilo.org/algorithmic-management-workplace "Algorithmic management in the workplace"
