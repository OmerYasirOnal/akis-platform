# Job Recommender Sistemleri ve Skills Matching

## 1. Ölçeklenebilir mimari: 2 aşamalı eşleştirme

Büyük işe alım sistemlerinde yaygın desen:

1. **Candidate retrieval** (embedding + approximate nearest neighbor)
2. **Reranking** (bağlamsal özelliklerle daha doğru sıralama)

CareerBuilder örneği bunu açıkça anlatır.

**Kaynak:** Zhao et al. (2021). "Embedding-based Recommender System for Job to Candidate Matching."  
[IRS Workshop 2021](https://irsworkshop.github.io/2021/publications/IRS2021_paper_6.pdf)

### AKIS sonucu (MVP → v1)

| Aşama | MVP | v1 |
|-------|-----|-----|
| Retrieval | Heuristics + basit embedding (opsiyonel) | `retrieval_index (ANN)` |
| Reranking | Basit skorlama | `reranker` (GBDT/NN) |
| Açıklama | Opsiyonel | `explanation_json` **zorunlu** |

Her match için açıklama üretimi zorunlu olmalı.

---

## 2. Skill→Job yaklaşımı (graf/semantik)

"Skills2Job" tarzı çalışmalar, beceriden işe öneri üretmek için dağılımsal semantik ve büyük iş ilanı havuzlarını kullanır.

**Kaynak:** Giabelli et al. (2021). "Skills2Job: A recommender system that encodes job offer embeddings and skill similarities."  
[ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S156849462030987X)

### AKIS sonucu

- **Veri modeli:** `skills`, `skill_evidence`, `job_required_skills`
- **Skill graph** ile öneri: "şu 2 skill'i ekle → şu işlere açılırsın" (istihdam etkisini artırır)
- Skill benzerliği ve transfer edilebilirlik modülü
- Eksik skill önerisi: "Bu iş için X ve Y becerileri eksik; öğrenmeye değer"

---

## 3. Job recommender literatür panoraması

Job recommender sistemleri üzerine survey'ler, e-recruiting akışını ve yaklaşımları sınıflandırır.

**Kaynak:** Job recommender systems survey.  
[ResearchGate](https://www.researchgate.net/publication/272802616_A_survey_of_job_recommender_systems)

### AKIS sonucu

- Eşleştirmeyi sadece "iş→aday" değil, **"aday→iş"** ve **"kariyer yolu"** önerisine genişlet
- İki yönlü akış: işveren için aday önerisi, freelancer için iş önerisi
- Kariyer gelişim önerileri (skill progression, benzer işlere geçiş)
