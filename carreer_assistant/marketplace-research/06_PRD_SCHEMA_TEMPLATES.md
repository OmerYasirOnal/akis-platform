# PRD Zorunlu Alanlar: Teknik Şablonlar

Bu doküman, literatür tabanlı araştırmalardan çıkan ürün kararlarını **doğrudan uygulanabilir şemalara** dönüştürür.

---

## 1. Matching Mode Configuration

### 1.1 Enum: `matching_mode`

```typescript
enum MatchingMode {
  SCORE_ONLY = 'score_only',           // Sadece skor tabanlı sıralama
  STABLE_MATCHING = 'stable_matching', // Gale-Shapley benzeri stabil eşleşme
  HYBRID = 'hybrid'                     // Skor + stabilite kombinasyonu
}
```

### 1.2 Config Schema

```typescript
interface MatchingConfig {
  mode: MatchingMode;
  
  // SCORE_ONLY için
  score_weights?: {
    skill_match: number;           // 0-1
    portfolio_relevance: number;   // 0-1
    past_performance: number;      // 0-1
    response_time: number;         // 0-1
    price_competitiveness: number; // 0-1
  };
  
  // STABLE_MATCHING için
  stability_config?: {
    max_iterations: number;        // Gale-Shapley max iterasyon
    allow_blocking_pairs: boolean; // Blocking pair toleransı
    preference_weights: {
      freelancer_preferences: number; // 0-1
      employer_preferences: number;   // 0-1
    };
  };
  
  // HYBRID için
  hybrid_config?: {
    score_weight: number;      // 0-1 (skor etkisi)
    stability_weight: number;  // 0-1 (stabilite etkisi)
    // score_weight + stability_weight = 1
  };
  
  // Tüm modlar için
  fairness_config: FairnessConfig;
}
```

### 1.3 Fairness Config

```typescript
interface FairnessConfig {
  enabled: boolean;
  fairness_budget: number;           // 0-1 (ne kadar exploration)
  exposure_balance_enabled: boolean;
  
  exposure_config?: {
    window_days: number;             // Exposure penceresi (örn. 30)
    min_exposure_ratio: number;      // Yeni freelancer'a min görünürlük (0-1)
    max_exposure_ratio: number;      // Sürekli kazananların max görünürlüğü (0-1)
  };
  
  exploration_strategy: 'epsilon_greedy' | 'thompson_sampling' | 'ucb';
  epsilon?: number;                  // epsilon_greedy için (0-1)
}
```

---

## 2. Explanation JSON Schema

### 2.1 Standard Format

```typescript
interface MatchExplanation {
  match_id: string;
  job_id: string;
  freelancer_id: string;
  
  // Ana faktörler
  top_factors: Factor[];
  
  // Eksik beceriler
  missing_skills: Skill[];
  
  // Portfolio kanıtları
  portfolio_evidence: PortfolioItem[];
  
  // Skorlar
  overall_score: number;       // 0-100
  confidence: number;          // 0-1
  
  // Adalet
  fairness_adjustment_applied: boolean;
  fairness_details?: FairnessDetails;
  
  // Meta
  generated_at: string;        // ISO 8601
  explanation_version: string; // Schema versiyonu
}
```

### 2.2 Factor Schema

```typescript
interface Factor {
  factor_type: 'skill_match' | 'portfolio_relevance' | 'past_performance' 
              | 'response_time' | 'price_competitiveness' | 'rating';
  
  weight: number;              // Bu faktörün toplam skordaki ağırlığı (0-1)
  contribution: number;        // Bu faktörün skoruna katkısı (0-100)
  
  details: {
    [key: string]: any;        // Faktör spesifik detaylar
  };
  
  human_readable: string;      // Kullanıcı dostu açıklama (i18n key)
}
```

### 2.3 Missing Skill Schema

```typescript
interface Skill {
  skill_name: string;
  skill_id: string;
  
  required_level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  freelancer_level: 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';
  
  gap_severity: 'critical' | 'important' | 'nice_to_have';
  
  // Öneriler
  suggested_actions: {
    action_type: 'take_course' | 'add_portfolio_item' | 'get_certification';
    resource_link?: string;
    estimated_time_days?: number;
  }[];
}
```

### 2.4 Portfolio Evidence Schema

```typescript
interface PortfolioItem {
  item_id: string;
  item_type: 'project' | 'certification' | 'education' | 'work_experience';
  title: string;
  
  relevance_score: number;     // 0-1 (bu işe ne kadar alakalı)
  matched_skills: string[];    // Bu portfolio item'dan match eden skill'ler
  
  evidence_strength: 'weak' | 'moderate' | 'strong';
  
  url?: string;
  thumbnail_url?: string;
}
```

### 2.5 Fairness Details Schema

```typescript
interface FairnessDetails {
  original_rank: number;       // Adalet düzeltmesi öncesi sıra
  adjusted_rank: number;       // Adalet düzeltmesi sonrası sıra
  
  exploration_applied: boolean;
  exploration_reason?: 'new_freelancer' | 'low_exposure' | 'diversity';
  
  exposure_stats: {
    total_impressions_30d: number;
    total_clicks_30d: number;
    exposure_percentile: number; // Bu freelancer'ın exposure'ı (0-100 percentile)
  };
}
```

---

## 3. Audit Log Event Types

### 3.1 Event Schema

```typescript
interface AuditEvent {
  event_id: string;
  event_type: AuditEventType;
  timestamp: string;           // ISO 8601
  
  actor: {
    actor_type: 'system' | 'user' | 'agent';
    actor_id: string;
    actor_name?: string;
  };
  
  subject: {
    subject_type: 'match' | 'job' | 'freelancer' | 'proposal' | 'contract';
    subject_id: string;
  };
  
  action: string;
  
  details: {
    [key: string]: any;
  };
  
  metadata: {
    request_id?: string;
    ip_address?: string;
    user_agent?: string;
  };
}
```

### 3.2 Event Types (Enum)

```typescript
enum AuditEventType {
  // Eşleştirme
  MATCH_GENERATED = 'match.generated',
  MATCH_PRESENTED = 'match.presented',
  MATCH_ACCEPTED = 'match.accepted',
  MATCH_REJECTED = 'match.rejected',
  
  // Adalet düzeltmeleri
  FAIRNESS_ADJUSTMENT_APPLIED = 'fairness.adjustment_applied',
  EXPLORATION_TRIGGERED = 'fairness.exploration_triggered',
  
  // İtiraz
  APPEAL_SUBMITTED = 'appeal.submitted',
  APPEAL_REVIEWED = 'appeal.reviewed',
  APPEAL_APPROVED = 'appeal.approved',
  APPEAL_REJECTED = 'appeal.rejected',
  
  // Algoritma değişiklikleri
  ALGORITHM_CONFIG_CHANGED = 'algorithm.config_changed',
  MATCHING_MODE_CHANGED = 'algorithm.matching_mode_changed',
  
  // Manuel müdahale
  MANUAL_OVERRIDE = 'manual.override',
  HUMAN_REVIEW_REQUESTED = 'manual.review_requested',
  HUMAN_REVIEW_COMPLETED = 'manual.review_completed',
}
```

### 3.3 Zorunlu Log Noktaları

| Event | Zorunluluk | Sebep |
|-------|------------|-------|
| `MATCH_GENERATED` | ✅ Zorunlu | Her eşleşme izi bırakmalı |
| `FAIRNESS_ADJUSTMENT_APPLIED` | ✅ Zorunlu | ILO compliance (şeffaflık) |
| `MANUAL_OVERRIDE` | ✅ Zorunlu | Denetim gereksinimi |
| `ALGORITHM_CONFIG_CHANGED` | ✅ Zorunlu | Değişiklik takibi |
| `APPEAL_SUBMITTED` | ✅ Zorunlu | Kullanıcı hakları |

---

## 4. Metrics Dashboard Schema

### 4.1 Core Metrics

```typescript
interface MarketplaceMetrics {
  // İstihdam sağlama metrikleri (OECD/ILO)
  employment_metrics: {
    time_to_first_gig: {
      avg_days: number;
      median_days: number;
      p95_days: number;
    };
    
    match_accept_rate: number;         // 0-1
    repeat_hire_rate: number;          // 0-1
    
    income_uplift_proxy: {
      avg_monthly_income_before?: number;
      avg_monthly_income_after: number;
      uplift_percentage?: number;
    };
    
    skill_progression: {
      users_with_skill_growth: number;
      avg_new_skills_per_user: number;
      skill_gap_closure_rate: number;  // 0-1
    };
  };
  
  // Eşleştirme kalitesi
  matching_quality: {
    avg_match_score: number;           // 0-100
    avg_confidence: number;            // 0-1
    
    top_10_accept_rate: number;        // İlk 10 önerinin kabul oranı
    
    match_success_rate: number;        // Match → tamamlanan iş oranı
  };
  
  // Adalet metrikleri
  fairness_metrics: {
    exposure_gini_coefficient: number; // 0-1 (0=perfect equality)
    
    new_freelancer_match_rate: number; // Yeni freelancer'ların match alma oranı
    
    exposure_distribution: {
      p10: number;  // En düşük %10'luk dilim
      p50: number;  // Medyan
      p90: number;  // En yüksek %10'luk dilim
    };
    
    exploration_rate: number;          // Exploration uygulanan match oranı
  };
  
  // Platform sağlığı
  platform_health: {
    total_active_freelancers: number;
    total_active_jobs: number;
    
    avg_proposals_per_job: number;
    avg_jobs_per_freelancer: number;
    
    churn_rate_30d: number;            // 0-1
    retention_rate_90d: number;        // 0-1
  };
}
```

### 4.2 Time Series Format

```typescript
interface MetricTimeSeries {
  metric_name: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  
  data_points: {
    timestamp: string;  // ISO 8601
    value: number;
    metadata?: {
      [key: string]: any;
    };
  }[];
}
```

### 4.3 Dashboard Widgets (PRD Requirement)

| Widget | Metrik | Güncelleme Sıklığı | Kaynak Literatür |
|--------|--------|-------------------|------------------|
| "İlk işe erişim" | `time_to_first_gig` | Günlük | OECD Handbook |
| "Eşleştirme başarısı" | `match_accept_rate`, `match_success_rate` | Gerçek zamanlı | - |
| "Gelir etkisi" | `income_uplift_proxy` | Aylık | OECD Handbook |
| "Skill gelişimi" | `skill_progression` | Haftalık | Skills2Job (Giabelli) |
| "Exposure adaleti" | `exposure_gini_coefficient` | Günlük | Sühr et al. |
| "Exploration oranı" | `exploration_rate` | Gerçek zamanlı | Two-sided fairness |

---

## 5. API Endpoint Önerileri (Matching Service)

### 5.1 Match Generation

```typescript
POST /api/v1/matching/generate

Request:
{
  "job_id": "string",
  "matching_config": MatchingConfig,
  "max_results": number,
  "include_explanation": boolean
}

Response:
{
  "matches": [
    {
      "freelancer_id": "string",
      "rank": number,
      "score": number,
      "explanation": MatchExplanation
    }
  ],
  "metadata": {
    "total_candidates_evaluated": number,
    "matching_mode_used": MatchingMode,
    "generation_time_ms": number
  }
}
```

### 5.2 Explanation Retrieval

```typescript
GET /api/v1/matching/explanation/{match_id}

Response: MatchExplanation
```

### 5.3 Appeal Submission

```typescript
POST /api/v1/matching/appeal

Request:
{
  "match_id": "string",
  "appeal_reason": "not_qualified" | "unfair_ranking" | "missing_evidence" | "other",
  "details": "string",
  "evidence_urls": ["string"]
}

Response:
{
  "appeal_id": "string",
  "status": "pending" | "under_review" | "approved" | "rejected",
  "estimated_review_time_hours": number
}
```

### 5.4 Metrics Dashboard

```typescript
GET /api/v1/matching/metrics

Query params:
- period: 'hourly' | 'daily' | 'weekly' | 'monthly'
- start_date: ISO 8601
- end_date: ISO 8601
- metric_groups: ['employment', 'matching_quality', 'fairness', 'platform_health']

Response: MarketplaceMetrics
```

---

## 6. Database Schema Önerileri

### 6.1 Matches Table

```sql
CREATE TABLE matches (
  match_id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(job_id),
  freelancer_id UUID NOT NULL REFERENCES freelancers(freelancer_id),
  
  -- Skorlar
  overall_score DECIMAL(5,2) NOT NULL,  -- 0-100
  confidence DECIMAL(3,2) NOT NULL,      -- 0-1
  
  -- Eşleştirme config
  matching_mode VARCHAR(20) NOT NULL,
  matching_config JSONB NOT NULL,
  
  -- Adalet
  fairness_adjustment_applied BOOLEAN DEFAULT FALSE,
  original_rank INTEGER,
  adjusted_rank INTEGER,
  
  -- Exposure tracking
  exposure_score INTEGER DEFAULT 0,
  
  -- Durum
  status VARCHAR(20) NOT NULL,  -- 'generated' | 'presented' | 'accepted' | 'rejected'
  
  -- Açıklama (JSONB)
  explanation JSONB NOT NULL,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_job_id (job_id),
  INDEX idx_freelancer_id (freelancer_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 6.2 Audit Log Table

```sql
CREATE TABLE audit_events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Actor
  actor_type VARCHAR(20) NOT NULL,  -- 'system' | 'user' | 'agent'
  actor_id UUID,
  
  -- Subject
  subject_type VARCHAR(20) NOT NULL,
  subject_id UUID NOT NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL,
  
  -- Details (JSONB)
  details JSONB,
  
  -- Metadata
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_subject (subject_type, subject_id),
  INDEX idx_actor (actor_type, actor_id)
);
```

### 6.3 Exposure Tracking Table

```sql
CREATE TABLE exposure_tracking (
  tracking_id UUID PRIMARY KEY,
  freelancer_id UUID NOT NULL REFERENCES freelancers(freelancer_id),
  
  -- Pencere
  date DATE NOT NULL,
  
  -- Metrikler
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  matches_generated INTEGER DEFAULT 0,
  matches_accepted INTEGER DEFAULT 0,
  
  -- Adalet
  exploration_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(freelancer_id, date),
  INDEX idx_freelancer_date (freelancer_id, date),
  INDEX idx_date (date)
);
```

---

## 7. Implementation Checklist (PRD Gate)

### Backend
- [ ] `MatchingConfig` enum ve interface tanımlandı
- [ ] `MatchExplanation` schema implement edildi
- [ ] `AuditEvent` logger servisi oluşturuldu
- [ ] Zorunlu audit log noktaları (`MATCH_GENERATED`, `FAIRNESS_ADJUSTMENT_APPLIED`, vb.) eklendi
- [ ] Metrics collection pipeline kuruldu
- [ ] Database migration'ları hazırlandı
- [ ] API endpoint'leri (`/matching/generate`, `/matching/explanation`, `/matching/appeal`) implement edildi

### Frontend
- [ ] "Neden önerildi?" açıklama paneli tasarlandı
- [ ] İtiraz formu ve akışı oluşturuldu
- [ ] Metrics dashboard widget'ları geliştirildi
- [ ] i18n key'leri (`explanation` için human_readable) eklendi

### Compliance
- [ ] ILO algorithmic management checklist'i tamamlandı
- [ ] OECD platform work policy ile uyumluluk doğrulandı
- [ ] Audit log retention policy belirlendi (min 1 yıl)
- [ ] Appeal review SLA tanımlandı (max 48 saat)

### Testing
- [ ] Matching mode'lar (`score_only`, `stable_matching`, `hybrid`) birim testleri
- [ ] Fairness adjustment test senaryoları
- [ ] Explanation generation testleri
- [ ] Audit log bütünlüğü testleri
- [ ] Metrics accuracy testleri

---

**Versiyon:** 1.0  
**Kaynak:** AKIS Marketplace Research Pack  
**Literatür temel:** Gale-Shapley, Sühr et al., Zhao et al., Zhang et al., ILO, OECD
