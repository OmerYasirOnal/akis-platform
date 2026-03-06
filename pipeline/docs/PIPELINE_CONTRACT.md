# Pipeline Contract — Lifecycle, API & Error Codes

## Pipeline Lifecycle

```
scribe_clarifying ──→ scribe_generating     (yeterli bilgi toplandığında)
scribe_clarifying ──→ scribe_generating     (3 tur soru sorulduktan sonra zorla)
scribe_generating ──→ awaiting_approval     (spec üretildiğinde)
scribe_generating ──→ scribe_clarifying     (spec validation failed → ek soru)
scribe_generating ──→ failed                (3 retry sonrası)
awaiting_approval ──→ proto_building        (kullanıcı onayladığında)
awaiting_approval ──→ scribe_generating     (kullanıcı "yeniden üret" dediğinde)
proto_building    ──→ trace_testing         (proto tamamlandığında — OTOMATİK)
proto_building    ──→ failed                (retry sonrası)
trace_testing     ──→ completed             (trace tamamlandığında)
trace_testing     ──→ completed_partial     (trace failed ama proto başarılı)
failed            ──→ (önceki stage)        ("Tekrar Dene" ile)
failed            ──→ scribe_clarifying     ("Baştan Başla" ile)
ANY               ──→ cancelled             (kullanıcı iptal)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pipelines` | Yeni pipeline başlat |
| GET | `/api/pipelines` | Kullanıcının pipeline listesi (history) |
| GET | `/api/pipelines/:id` | Pipeline durumu + conversation + outputs |
| POST | `/api/pipelines/:id/message` | Scribe'a mesaj gönder |
| POST | `/api/pipelines/:id/approve` | Spec onayla (opsiyonel düzenlenmiş spec body'de) |
| POST | `/api/pipelines/:id/reject` | Spec reddet (feedback body'de) |
| POST | `/api/pipelines/:id/retry` | Mevcut stage'i tekrar dene |
| POST | `/api/pipelines/:id/skip-trace` | Trace'i atla, completed_partial |
| DELETE | `/api/pipelines/:id` | Pipeline iptal |

## Error Codes

### Scribe Errors
| Code | Message | Retryable | Recovery |
|------|---------|-----------|----------|
| AI_RATE_LIMITED | AI servisi şu an yoğun | Yes (3x) | retry |
| AI_PROVIDER_ERROR | AI servisi geçici hata | Yes (2x) | retry |
| AI_INVALID_RESPONSE | Beklenmeyen yanıt | Yes (3x) | retry |
| SCRIBE_EMPTY_IDEA | Fikir çok kısa | No | — |
| SCRIBE_SPEC_VALIDATION_FAILED | Spec yetersiz | Yes (2x) | retry |

### Proto Errors
| Code | Message | Retryable | Recovery |
|------|---------|-----------|----------|
| GITHUB_NOT_CONNECTED | GitHub bağlı değil | No | reconnect_github |
| GITHUB_REPO_EXISTS | Repo zaten var | No | edit_spec |
| GITHUB_PERMISSION_DENIED | İzin yetersiz | No | reconnect_github |
| GITHUB_API_ERROR | GitHub API hatası | Yes (3x) | retry |
| PROTO_SCAFFOLD_GENERATION_FAILED | Kod üretim hatası | Yes (2x) | retry |
| PROTO_PUSH_FAILED | Push hatası | Yes (3x) | retry |

### Trace Errors
| Code | Message | Retryable | Recovery |
|------|---------|-----------|----------|
| TRACE_CODE_READ_FAILED | Kod okunamadı | Yes (3x) | retry |
| TRACE_EMPTY_CODEBASE | Kaynak kod yok | No | edit_spec |
| TRACE_TEST_GENERATION_FAILED | Test üretim hatası | Yes (2x) | retry |

### General Errors
| Code | Message | Retryable | Recovery |
|------|---------|-----------|----------|
| AI_KEY_MISSING | AI yapılandırılmamış | No | — |
| PIPELINE_TIMEOUT | Stage timeout (5dk) | Yes | retry |
| PIPELINE_CANCELLED | Kullanıcı iptal | No | — |
| NETWORK_ERROR | Bağlantı kesildi | Yes | retry |

## Retry Policy

- Max retries: 3
- Backoff delays: 5s, 15s, 30s (exponential)
- Spec validation retries: 2 (with different prompt variation)
- Stage timeout: 5 minutes

## Data Flow

```
ScribeInput (idea)
  → ScribeClarification (questions) ←→ user answers (max 3 rounds)
  → ScribeOutput (StructuredSpec + rawMarkdown + confidence)
  → [User Approval / Edit / Regenerate]
  → ProtoInput (spec + repoName + visibility)
  → ProtoOutput (branch + files + repoUrl + setupCommands)
  → TraceInput (repo + branch + spec)
  → TraceOutput (testFiles + coverageMatrix + testSummary)
```

## Real-time Events (SSE/WebSocket)

Events emitted during pipeline execution:
- `pipeline:stage_change` — stage transition
- `pipeline:agent_status` — agent thinking/working indicator
- `pipeline:message` — new conversation message
- `pipeline:error` — error occurred
- `pipeline:completed` — pipeline finished
