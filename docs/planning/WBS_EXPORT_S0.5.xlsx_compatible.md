# WBS Export — S0.5 Pilot Demo + Mezuniyet

> **Version:** 2.0.0  
> **Date:** 2026-02-09  
> **Schema:** 04_Gorevler (Excel uyumlu)  
> **Plan Referans:** [`DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## WBS Tablosu (Markdown)

| Gorev_ID | Faz | Sprint | Workstream | Baslik | Aciklama | Sorumlu | Destek | Reviewer | Durum | Plan_Baslangic | Plan_Bitis | Gercek_Bitis | Teslimat | Kabul_Kriteri | Not |
|----------|-----|--------|------------|--------|----------|---------|--------|----------|-------|----------------|------------|--------------|----------|---------------|-----|
| S0.5.0-OPS-1 | 0.5 | S0.5.0 | WS-OPS | Frontend base URL fix | client.ts ve HttpClient.ts'de getApiBaseUrl() kullanimi | Yasir | — | Yasir | Done | 2026-02-07 | 2026-02-08 | 2026-02-08 | Kod degisikligi (2 dosya) | grep localhost:3000 dist/ = 0 sonuc | PR #217+#226 |
| S0.5.0-OPS-2 | 0.5 | S0.5.0 | WS-OPS | Backend trust-proxy | env.ts'ye TRUST_PROXY ekle, server.app.ts'de trustProxy ayarla | Yasir | — | Yasir | Done | 2026-02-07 | 2026-02-08 | 2026-02-08 | Kod degisikligi (2 dosya) | request.protocol=https Caddy arkasinda | PR #230 |
| S0.5.0-OPS-3 | 0.5 | S0.5.0 | WS-OPS | Staging env + OAuth callback | .env dogrulama, GitHub OAuth App callback URL guncelleme | Yasir | — | Yasir | Done | 2026-02-08 | 2026-02-09 | 2026-02-08 | Env konfigurasyon | OAuth login staging'de calisiyor | PR #232 |
| S0.5.0-OPS-4 | 0.5 | S0.5.0 | WS-OPS | Smoke test localhost check | staging_smoke.sh'a localhost leak kontrolu ekle | Yasir | — | Yasir | Done | 2026-02-08 | 2026-02-09 | 2026-02-08 | Script guncelleme | Otomatik localhost leak detection | PR #233 |
| S0.5.0-OPS-5 | 0.5 | S0.5.0 | WS-OPS | DB migration ve health | Staging DB health check, migration dogrulama | Yasir | — | Yasir | Done | 2026-02-07 | 2026-02-08 | 2026-02-08 | Dogrulama raporu | /ready endpoint ready:true donuyor | PR #234 |
| S0.5.0-OPS-6 | 0.5 | S0.5.0 | WS-OPS | Deploy + full smoke test | Staging'e deploy ve tum smoke test'leri calistir | Yasir | — | Yasir | Done | 2026-02-09 | 2026-02-09 | 2026-02-08 | Deploy log + smoke raporu | 6/6 smoke test pass | PR #235 |
| S0.5.1-WL-1 | 0.5 | S0.5.1 | WS-WAITLIST | Invite stratejisi | Email davet + acik signup + SMTP transport + Turkish templates | Yasir | Ayse | Yasir | Done | 2026-02-10 | 2026-02-11 | 2026-02-09 | Strateji + kod (invite endpoint, accept flow, InviteAccept page) | 26 unit + 6 E2E test pass | PR #238 |
| S0.5.1-WL-1b | 0.5 | S0.5.1 | WS-WAITLIST | Welcome email after verification | sendWelcomeEmail fired after verify-email (fire-and-forget) | Yasir | — | Yasir | Done | 2026-02-09 | 2026-02-09 | 2026-02-09 | Kod degisikligi | 4 unit test pass | PR #238 |
| S0.5.1-WL-2 | 0.5 | S0.5.1 | WS-WAITLIST | Onboarding flow | Signup->AI key->first job akisi ve Getting Started karti | Yasir | — | Yasir | Not Started | 2026-02-11 | 2026-02-14 | — | UI bileseni | Signup'tan ilk job'a 5 dk | Dep: OPS-6 |
| S0.5.1-WL-3 | 0.5 | S0.5.1 | WS-WAITLIST | Feedback capture | FeedbackTab entegrasyonu, thumbs up/down + metin | Yasir | — | Yasir | Not Started | 2026-02-14 | 2026-02-16 | — | UI + API endpoint | Job sonrasi geri bildirim calisiyor | Dep: WL-2 |
| S0.5.1-AGT-1 | 0.5 | S0.5.1 | WS-AGENTS | Agent contract dokumani | 3 ajan icin input/output schema + error codes | Yasir | — | Yasir | Done | 2026-02-14 | 2026-02-16 | 2026-02-08 | docs/agents/AGENT_CONTRACTS_S0.5.md | Her ajan icin schema listelenmis | Delivered early |
| S0.5.1-AGT-2 | 0.5 | S0.5.1 | WS-AGENTS | Playbook determinizm | temperature=0, seed=42, prompt sabitleme, AI_DETERMINISTIC_MODE env | Yasir | — | Yasir | Done | 2026-02-17 | 2026-02-18 | 2026-02-09 | prompt-constants.ts + playbook guncelleme | 17 unit test pass | Delivered early |
| S0.5.1-AGT-3 | 0.5 | S0.5.1 | WS-AGENTS | Scribe golden path | Staging'de dry-run documentation job dogrulama | Yasir | — | Yasir | Done | 2026-02-18 | 2026-02-20 | 2026-02-09 | SCRIBE_GOLDEN_PATH.md + 12 E2E test | E2E pass, staging deploy bekleniyor | Delivered early |
| S0.5.1-AGT-4 | 0.5 | S0.5.1 | WS-AGENTS | Trace golden path | Spec text'inden test plani uretimi dogrulama | Yasir | — | Yasir | Done | 2026-02-18 | 2026-02-20 | 2026-02-09 | TRACE_GOLDEN_PATH.md + 10 E2E test | E2E pass | Delivered early |
| S0.5.1-AGT-5 | 0.5 | S0.5.1 | WS-AGENTS | Proto golden path | Feature tanindan scaffold uretimi dogrulama | Yasir | — | Yasir | Done | 2026-02-18 | 2026-02-20 | 2026-02-09 | PROTO_GOLDEN_PATH.md + 12 E2E test | E2E pass | Delivered early |
| S0.5.1-AGT-6 | 0.5 | S0.5.1 | WS-AGENTS | Hata handling standardizasyonu | Standard error envelope (sendError), global error handler, 404 fix, MISSING_DEPENDENCY hint | Yasir | — | Yasir | Done | 2026-02-20 | 2026-02-21 | 2026-02-09 | Error mapping kodu + 39 unit test | 5+ senaryoda UI mesaj gosteriyor | Delivered early |
| S0.5.1-OPS-7 | 0.5 | S0.5.1 | WS-OPS | Staging MCP env + gateway dogrulama | GITHUB_MCP_BASE_URL + GITHUB_TOKEN VM env'e ekle, /ready mcp alanlarini dogrula | Yasir | — | Yasir | In Progress | 2026-02-09 | 2026-02-10 | — | VM env konfigurasyon + smoke | /ready mcp.configured:true + agent job basarili | PR #246, deploy bekleniyor |
| S0.5.1-OPS-8 | 0.5 | S0.5.1 | WS-OPS | SMTP deliverability dogrulama | SPF/DKIM/DMARC DNS + OAuth login sonrasi email gercek testi | Yasir | — | Yasir | In Progress | 2026-02-09 | 2026-02-11 | — | DNS kayit + email test | OAuth welcome email inbox'a dusuyor | PR #246, deploy + DNS bekleniyor |
| S0.5.1-UX-4 | 0.5 | S0.5.1 | WS-UX | Agents route consolidation | /agents/* canonical, /dashboard/scribe redirect, sidebar temizligi | Yasir | — | Yasir | In Progress | 2026-02-09 | 2026-02-10 | — | Kod + test | /agents/scribe calisiyor, redirect aktif | PR #246, deploy + smoke bekleniyor |
| S0.5.2-RAG-1 | 0.5 | S0.5.2 | WS-RAG | Research brief + karar | RAG secenekleri degerlendirmesi ve karar | Yasir | Ayse | Yasir | Not Started | 2026-02-17 | 2026-02-18 | — | RESEARCH_BRIEF dosyasi | Karar kilitlenmis | — |
| S0.5.2-RAG-2 | 0.5 | S0.5.2 | WS-RAG | Context pack dogrulama | ScribeAgent context toplama mekanizmasi test | Yasir | — | Yasir | Not Started | 2026-02-20 | 2026-02-21 | — | Dogrulama raporu | Context dogru toplaniyor | Dep: AGT-3 |
| S0.5.2-UX-1 | 0.5 | S0.5.2 | WS-UX | Trace console sayfasi | DashboardAgentTracePage.tsx + useAgentStatus hook | Yasir | — | Yasir | Done | 2026-02-10 | 2026-02-13 | 2026-02-08 | Frontend sayfasi | /agents/trace calisiyor | PR #236 |
| S0.5.2-UX-2 | 0.5 | S0.5.2 | WS-UX | Proto console sayfasi | DashboardAgentProtoPage.tsx + E2E tests | Yasir | — | Yasir | Done | 2026-02-10 | 2026-02-13 | 2026-02-08 | Frontend sayfasi | /agents/proto calisiyor | Delivered with Trace |
| S0.5.2-UX-3 | 0.5 | S0.5.2 | WS-UX | Getting Started karti | 3-step onboarding card (AI keys, first run, explore) | Yasir | — | Yasir | Done | 2026-02-14 | 2026-02-16 | 2026-02-09 | UI bileseni + 6 unit + 5 E2E | Yeni kullanici yonlendirilmis | Delivered early |
| S0.5.2-UX-4 | 0.5 | S0.5.2 | WS-UX | Agents Hub sidebar entrypoint | Agents Hub link in sidebar + E2E test | Yasir | — | Yasir | Done | 2026-02-09 | 2026-02-09 | 2026-02-09 | Sidebar guncelleme | /agents hub link calisiyor | PR #246 |
| S0.5.3-QA-1 | 0.5 | S0.5.3 | WS-QA | Regression checklist | REGRESSION_CHECKLIST_S0.5.md olustur | Yasir | Ayse | Yasir | Not Started | 2026-02-24 | 2026-02-25 | — | QA dokumani | Her item pass/fail | Dep: AGT-3~5 |
| S0.5.3-QA-2 | 0.5 | S0.5.3 | WS-QA | Demo scripti | 15 dk canli demo akisi scripti | Yasir | Ayse | Yasir | Not Started | 2026-02-25 | 2026-02-26 | — | DEMO_SCRIPT_S0.5.md | 1x prova yapilmis | Dep: QA-1 |
| S0.5.3-QA-3 | 0.5 | S0.5.3 | WS-QA | QA evidence | Screenshot + pass/fail tablosu | Yasir | Ayse | Yasir | Not Started | 2026-02-26 | 2026-02-27 | — | QA_EVIDENCE_S0.5_PILOT.md | Tum golden path evidence | Dep: QA-2 |
| S0.5.3-QA-4 | 0.5 | S0.5.3 | WS-QA | Tez hazirlik notu | Tez bolum basliklari + outline | Ayse | Yasir | Yasir | Not Started | 2026-02-17 | 2026-02-21 | — | THESIS_OUTLINE_S0.5.md | Danismana gosterilebilir | — |

---

## CSV Bloku (Excel'e Paste Edilebilir)

Asagidaki CSV blogunu kopyalayip Excel'e yapistirabilirsiniz:

```csv
Gorev_ID,Faz,Sprint,Workstream,Baslik,Aciklama,Sorumlu,Destek,Reviewer,Durum,Plan_Baslangic,Plan_Bitis,Gercek_Bitis,Teslimat,Kabul_Kriteri,Not
S0.5.0-OPS-1,0.5,S0.5.0,WS-OPS,Frontend base URL fix,client.ts ve HttpClient.ts'de getApiBaseUrl() kullanimi,Yasir,,Yasir,Done,2026-02-07,2026-02-08,2026-02-08,Kod degisikligi (2 dosya),grep localhost:3000 dist/ = 0 sonuc,PR #217+#226
S0.5.0-OPS-2,0.5,S0.5.0,WS-OPS,Backend trust-proxy,env.ts'ye TRUST_PROXY ekle server.app.ts'de trustProxy ayarla,Yasir,,Yasir,Done,2026-02-07,2026-02-08,2026-02-08,Kod degisikligi (2 dosya),request.protocol=https Caddy arkasinda,PR #230
S0.5.0-OPS-3,0.5,S0.5.0,WS-OPS,Staging env + OAuth callback,.env dogrulama GitHub OAuth App callback URL guncelleme,Yasir,,Yasir,Done,2026-02-08,2026-02-09,2026-02-08,Env konfigurasyon,OAuth login staging'de calisiyor,PR #232
S0.5.0-OPS-4,0.5,S0.5.0,WS-OPS,Smoke test localhost check,staging_smoke.sh'a localhost leak kontrolu ekle,Yasir,,Yasir,Done,2026-02-08,2026-02-09,2026-02-08,Script guncelleme,Otomatik localhost leak detection,PR #233
S0.5.0-OPS-5,0.5,S0.5.0,WS-OPS,DB migration ve health,Staging DB health check migration dogrulama,Yasir,,Yasir,Done,2026-02-07,2026-02-08,2026-02-08,Dogrulama raporu,/ready endpoint ready:true donuyor,PR #234
S0.5.0-OPS-6,0.5,S0.5.0,WS-OPS,Deploy + full smoke test,Staging'e deploy ve tum smoke test'leri calistir,Yasir,,Yasir,Done,2026-02-09,2026-02-09,2026-02-08,Deploy log + smoke raporu,6/6 smoke test pass,PR #235
S0.5.1-WL-1,0.5,S0.5.1,WS-WAITLIST,Invite stratejisi,Email davet + acik signup + SMTP transport + Turkish templates,Yasir,Ayse,Yasir,Done,2026-02-10,2026-02-11,2026-02-09,Strateji + kod (invite endpoint accept flow),26 unit + 6 E2E test pass,PR #238
S0.5.1-WL-1b,0.5,S0.5.1,WS-WAITLIST,Welcome email after verification,sendWelcomeEmail fired after verify-email,Yasir,,Yasir,Done,2026-02-09,2026-02-09,2026-02-09,Kod degisikligi,4 unit test pass,PR #238
S0.5.1-WL-2,0.5,S0.5.1,WS-WAITLIST,Onboarding flow,Signup->AI key->first job akisi ve Getting Started karti,Yasir,,Yasir,Not Started,2026-02-11,2026-02-14,,UI bileseni,Signup'tan ilk job'a 5 dk,Dep: OPS-6
S0.5.1-WL-3,0.5,S0.5.1,WS-WAITLIST,Feedback capture,FeedbackTab entegrasyonu thumbs up/down + metin,Yasir,,Yasir,Not Started,2026-02-14,2026-02-16,,UI + API endpoint,Job sonrasi geri bildirim calisiyor,Dep: WL-2
S0.5.1-AGT-1,0.5,S0.5.1,WS-AGENTS,Agent contract dokumani,3 ajan icin input/output schema + error codes,Yasir,,Yasir,Done,2026-02-14,2026-02-16,2026-02-08,docs/agents/AGENT_CONTRACTS_S0.5.md,Her ajan icin schema listelenmis,Delivered early
S0.5.1-AGT-2,0.5,S0.5.1,WS-AGENTS,Playbook determinizm,temperature=0 seed=42 prompt sabitleme AI_DETERMINISTIC_MODE,Yasir,,Yasir,Done,2026-02-17,2026-02-18,2026-02-09,prompt-constants.ts,17 unit test pass,Delivered early
S0.5.1-AGT-3,0.5,S0.5.1,WS-AGENTS,Scribe golden path,Staging'de dry-run documentation job dogrulama,Yasir,,Yasir,Done,2026-02-18,2026-02-20,2026-02-09,SCRIBE_GOLDEN_PATH.md + 12 E2E test,E2E pass staging bekleniyor,Delivered early
S0.5.1-AGT-4,0.5,S0.5.1,WS-AGENTS,Trace golden path,Spec text'inden test plani uretimi dogrulama,Yasir,,Yasir,Done,2026-02-18,2026-02-20,2026-02-09,TRACE_GOLDEN_PATH.md + 10 E2E test,E2E pass,Delivered early
S0.5.1-AGT-5,0.5,S0.5.1,WS-AGENTS,Proto golden path,Feature tanindan scaffold uretimi dogrulama,Yasir,,Yasir,Done,2026-02-18,2026-02-20,2026-02-09,PROTO_GOLDEN_PATH.md + 12 E2E test,E2E pass,Delivered early
S0.5.1-AGT-6,0.5,S0.5.1,WS-AGENTS,Hata handling standardizasyonu,sendError + global handler + MISSING_DEPENDENCY hint + 39 unit test,Yasir,,Yasir,Done,2026-02-20,2026-02-21,2026-02-09,Error mapping kodu,5+ senaryoda UI mesaj gosteriyor,Delivered early
S0.5.1-OPS-7,0.5,S0.5.1,WS-OPS,Staging MCP env + gateway dogrulama,GITHUB_MCP_BASE_URL + GITHUB_TOKEN VM env + /ready mcp,Yasir,,Yasir,In Progress,2026-02-09,2026-02-10,,VM env + smoke,/ready mcp.configured:true + agent job OK,PR #246 deploy bekleniyor
S0.5.1-OPS-8,0.5,S0.5.1,WS-OPS,SMTP deliverability dogrulama,SPF/DKIM/DMARC DNS + OAuth welcome email gercek test,Yasir,,Yasir,In Progress,2026-02-09,2026-02-11,,DNS kayit + email test,OAuth welcome email inbox'a dusuyor,PR #246 deploy + DNS bekleniyor
S0.5.1-UX-4b,0.5,S0.5.1,WS-UX,Agents route consolidation dogrulama,/dashboard/scribe redirect + sidebar temizligi staging smoke,Yasir,,Yasir,In Progress,2026-02-09,2026-02-10,,Smoke test,/agents/scribe calisiyor redirect aktif,PR #246 deploy bekleniyor
S0.5.2-RAG-1,0.5,S0.5.2,WS-RAG,Research brief + karar,RAG secenekleri degerlendirmesi ve karar,Yasir,Ayse,Yasir,Not Started,2026-02-17,2026-02-18,,RESEARCH_BRIEF dosyasi,Karar kilitlenmis,
S0.5.2-RAG-2,0.5,S0.5.2,WS-RAG,Context pack dogrulama,ScribeAgent context toplama mekanizmasi test,Yasir,,Yasir,Not Started,2026-02-20,2026-02-21,,Dogrulama raporu,Context dogru toplaniyor,Dep: AGT-3
S0.5.2-UX-1,0.5,S0.5.2,WS-UX,Trace console sayfasi,DashboardAgentTracePage.tsx + useAgentStatus hook,Yasir,,Yasir,Done,2026-02-10,2026-02-13,2026-02-08,Frontend sayfasi,/agents/trace calisiyor,PR #236
S0.5.2-UX-2,0.5,S0.5.2,WS-UX,Proto console sayfasi,DashboardAgentProtoPage.tsx + E2E tests,Yasir,,Yasir,Done,2026-02-10,2026-02-13,2026-02-08,Frontend sayfasi,/agents/proto calisiyor,Delivered with Trace
S0.5.2-UX-3,0.5,S0.5.2,WS-UX,Getting Started karti,3-step onboarding card (AI keys first run explore),Yasir,,Yasir,Done,2026-02-14,2026-02-16,2026-02-09,UI bileseni + 6 unit + 5 E2E,Yeni kullanici yonlendirilmis,Delivered early
S0.5.2-UX-4,0.5,S0.5.2,WS-UX,Agents Hub sidebar entrypoint,Agents Hub link in sidebar + E2E test,Yasir,,Yasir,Done,2026-02-09,2026-02-09,2026-02-09,Sidebar guncelleme,/agents hub link calisiyor,PR #246
S0.5.3-QA-1,0.5,S0.5.3,WS-QA,Regression checklist,REGRESSION_CHECKLIST_S0.5.md olustur,Yasir,Ayse,Yasir,Not Started,2026-02-24,2026-02-25,,QA dokumani,Her item pass/fail,Dep: AGT-3~5
S0.5.3-QA-2,0.5,S0.5.3,WS-QA,Demo scripti,15 dk canli demo akisi scripti,Yasir,Ayse,Yasir,Not Started,2026-02-25,2026-02-26,,DEMO_SCRIPT_S0.5.md,1x prova yapilmis,Dep: QA-1
S0.5.3-QA-3,0.5,S0.5.3,WS-QA,QA evidence,Screenshot + pass/fail tablosu,Yasir,Ayse,Yasir,Not Started,2026-02-26,2026-02-27,,QA_EVIDENCE_S0.5_PILOT.md,Tum golden path evidence,Dep: QA-2
S0.5.3-QA-4,0.5,S0.5.3,WS-QA,Tez hazirlik notu,Tez bolum basliklari + outline,Ayse,Yasir,Yasir,Not Started,2026-02-17,2026-02-21,,THESIS_OUTLINE_S0.5.md,Danismana gosterilebilir,
```

---

## Ozet Istatistikleri

| Metrik | Deger |
|--------|-------|
| Toplam gorev | 30 |
| WS-OPS | 8 (6 Done, 2 In Progress) |
| WS-WAITLIST | 4 (2 Done, 2 Not Started) |
| WS-AGENTS | 6 (6 Done) |
| WS-RAG | 2 (2 Not Started) |
| WS-UX | 5 (4 Done, 1 In Progress) |
| WS-QA | 4 (4 Not Started) |
| Done | 20 |
| In Progress | 3 (OPS-7, OPS-8, UX-4b) |
| Not Started | 7 (WL-2, WL-3, RAG-1, RAG-2, QA-1~4) |
| Sprint S0.5.0 (7-9 Sub) | 6 gorev (6 Done) |
| Sprint S0.5.1 (10-21 Sub) | 16 gorev (13 Done, 3 In Progress) |
| Sprint S0.5.2 (10-23 Sub) | 6 gorev (4 Done, 2 Not Started) |
| Sprint S0.5.3 (24-28 Sub) | 4 gorev (4 Not Started) |
| P0 Blocker (simdi) | OPS-7 (MCP staging), OPS-8 (SMTP deliverability) |
| Kritik yol | OPS-7 -> Staging agent golden path verify -> QA-1 -> QA-3 |

---

*Bu dosya `docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md` ile senkronize tutulmalidir.  
Son guncelleme: 2026-02-09 (PR #246 sonrasi WBS senkronizasyonu)*
