# AKIS Workstream Matching Model

## 1. MVP Deterministic Scoring
Score range: 0.0 - 1.0

Weighted factors:
- `skill_overlap` (0.40)
- `seniority_fit` (0.20)
- `language_fit` (0.15)
- `location_remote_fit` (0.15)
- `keyword_relevance` (0.10)

Final score:
`score = sum(weight_i * factor_i)`

## 2. Feature Definitions
- `skill_overlap`: intersection(profile_skills, required_skills)/required_skills_count
- `seniority_fit`: exact or adjacent seniority mapping
- `language_fit`: job language supported by profile
- `location_remote_fit`: profile preference compatibility
- `keyword_relevance`: normalized keyword hits over description

## 3. Explainability Output
Every match stores `explanation` JSON with:
- top factors and numeric contributions
- missing skills
- confidence
- fairness adjustment flag
- human-readable summary

## 4. Fairness Constraints (MVP)
- Protected attributes are not used in scoring.
- Exposure tracking fields are stored for future fairness budget policy.
- Bias checks (batch/offline MVP checks):
  - score distribution by seniority bucket
  - acceptance proxy disparity alerts

## 5. ML-Ready Evolution
Planned v1 additions:
- embeddings for retrieval
- learned reranker
- calibrated confidence
- fairness-aware reranking constraints

## 6. Research Mapping
- Stability and two-sided fairness concepts map to
  `carreer_assistant/marketplace-research/01_MATCHING_MECHANISMS.md`
- Explainability schema maps to
  `carreer_assistant/marketplace-research/03_FAIRNESS_TRANSPARENCY_EXPLAINABILITY.md`
