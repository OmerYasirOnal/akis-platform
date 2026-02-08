# WBS Export — S0.5 Pilot Demo + Mezuniyet

> **Version:** 1.0.0  
> **Date:** 2026-02-07  
> **Schema:** 04_Gorevler (Excel uyumlu)  
> **Plan Referans:** [`DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## WBS Tablosu (Markdown)

| Gorev_ID | Faz | Sprint | Workstream | Baslik | Aciklama | Sorumlu | Destek | Reviewer | Durum | Plan_Baslangic | Plan_Bitis | Gercek_Bitis | Teslimat | Kabul_Kriteri | Not |
|----------|-----|--------|------------|--------|----------|---------|--------|----------|-------|----------------|------------|--------------|----------|---------------|-----|
| S0.5.0-OPS-1 | 0.5 | S0.5.0 | WS-OPS | Frontend base URL fix | client.ts ve HttpClient.ts'de getApiBaseUrl() kullanimi | Yasir | — | Yasir | Not Started | 2026-02-07 | 2026-02-08 | — | Kod degisikligi (2 dosya) | grep localhost:3000 dist/ = 0 sonuc | P0 BLOCKER |
| S0.5.0-OPS-2 | 0.5 | S0.5.0 | WS-OPS | Backend trust-proxy | env.ts'ye TRUST_PROXY ekle, server.app.ts'de trustProxy ayarla | Yasir | — | Yasir | Not Started | 2026-02-07 | 2026-02-08 | — | Kod degisikligi (2 dosya) | request.protocol=https Caddy arkasinda | P0 BLOCKER |
| S0.5.0-OPS-3 | 0.5 | S0.5.0 | WS-OPS | Staging env + OAuth callback | .env dogrulama, GitHub OAuth App callback URL guncelleme | Yasir | — | Yasir | Not Started | 2026-02-08 | 2026-02-09 | — | Env konfigurasyon | OAuth login staging'de calisiyor | Dep: OPS-1,OPS-2 |
| S0.5.0-OPS-4 | 0.5 | S0.5.0 | WS-OPS | Smoke test localhost check | staging_smoke.sh'a localhost leak kontrolu ekle | Yasir | — | Yasir | Not Started | 2026-02-08 | 2026-02-09 | — | Script guncelleme | Otomatik localhost leak detection | Dep: OPS-1 |
| S0.5.0-OPS-5 | 0.5 | S0.5.0 | WS-OPS | DB migration ve health | Staging DB health check, migration dogrulama | Yasir | — | Yasir | Not Started | 2026-02-07 | 2026-02-08 | — | Dogrulama raporu | /ready endpoint ready:true donuyor | — |
| S0.5.0-OPS-6 | 0.5 | S0.5.0 | WS-OPS | Deploy + full smoke test | Staging'e deploy ve tum smoke test'leri calistir | Yasir | — | Yasir | Not Started | 2026-02-09 | 2026-02-09 | — | Deploy log + smoke raporu | 6/6 smoke test pass | Dep: OPS-1~5 |
| S0.5.1-WL-1 | 0.5 | S0.5.1 | WS-WAITLIST | Invite stratejisi | Email davet + acik signup stratejisi dokumante et | Yasir | Ayse | Yasir | Not Started | 2026-02-10 | 2026-02-11 | — | Strateji dokumani | Takimca onaylanmis | Dep: OPS-6 |
| S0.5.1-WL-2 | 0.5 | S0.5.1 | WS-WAITLIST | Onboarding flow | Signup->AI key->first job akisi ve Getting Started karti | Yasir | — | Yasir | Not Started | 2026-02-11 | 2026-02-14 | — | UI bileseni | Signup'tan ilk job'a 5 dk | Dep: OPS-6 |
| S0.5.1-WL-3 | 0.5 | S0.5.1 | WS-WAITLIST | Feedback capture | FeedbackTab entegrasyonu, thumbs up/down + metin | Yasir | — | Yasir | Not Started | 2026-02-14 | 2026-02-16 | — | UI + API endpoint | Job sonrasi geri bildirim calisiyor | Dep: WL-2 |
| S0.5.1-AGT-1 | 0.5 | S0.5.1 | WS-AGENTS | Agent contract dokumani | 3 ajan icin input/output schema + error codes | Yasir | — | Yasir | Not Started | 2026-02-14 | 2026-02-16 | — | docs/agents/AGENT_CONTRACTS_S0.5.md | Her ajan icin schema listelenmis | — |
| S0.5.1-AGT-2 | 0.5 | S0.5.1 | WS-AGENTS | Playbook determinizm | temperature=0, seed, prompt sabitleme kontrolu | Yasir | — | Yasir | Not Started | 2026-02-17 | 2026-02-18 | — | Playbook guncelleme | Ayni input -> ayni prompt | — |
| S0.5.1-AGT-3 | 0.5 | S0.5.1 | WS-AGENTS | Scribe golden path | Staging'de dry-run documentation job dogrulama | Yasir | — | Yasir | Not Started | 2026-02-18 | 2026-02-20 | — | Test raporu | 3 denemenin 2'si basarili | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-4 | 0.5 | S0.5.1 | WS-AGENTS | Trace golden path | Spec text'inden test plani uretimi dogrulama | Yasir | — | Yasir | Not Started | 2026-02-18 | 2026-02-20 | — | Test raporu | 3 denemenin 2'si basarili | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-5 | 0.5 | S0.5.1 | WS-AGENTS | Proto golden path | Feature tanindan scaffold uretimi dogrulama | Yasir | — | Yasir | Not Started | 2026-02-18 | 2026-02-20 | — | Test raporu | 3 denemenin 2'si basarili | Dep: OPS-6, AGT-1 |
| S0.5.1-AGT-6 | 0.5 | S0.5.1 | WS-AGENTS | Hata handling standardizasyonu | 5 hata senaryosu icin kullanici mesaji | Yasir | — | Yasir | Not Started | 2026-02-20 | 2026-02-21 | — | Error mapping kodu | 5 senaryoda UI mesaj gosteriyor | Dep: AGT-1 |
| S0.5.2-RAG-1 | 0.5 | S0.5.2 | WS-RAG | Research brief + karar | RAG secenekleri degerlendirmesi ve karar | Yasir | Ayse | Yasir | Not Started | 2026-02-17 | 2026-02-18 | — | RESEARCH_BRIEF dosyasi | Karar kilitlenmis | — |
| S0.5.2-RAG-2 | 0.5 | S0.5.2 | WS-RAG | Context pack dogrulama | ScribeAgent context toplama mekanizmasi test | Yasir | — | Yasir | Not Started | 2026-02-20 | 2026-02-21 | — | Dogrulama raporu | Context dogru toplaniyor | Dep: AGT-3 |
| S0.5.2-UX-1 | 0.5 | S0.5.2 | WS-UX | Trace console sayfasi | DashboardAgentTracePage.tsx olustur | Yasir | — | Yasir | Not Started | 2026-02-10 | 2026-02-13 | — | Frontend sayfasi | /dashboard/trace calisiyor | Dep: OPS-6 |
| S0.5.2-UX-2 | 0.5 | S0.5.2 | WS-UX | Proto console sayfasi | DashboardAgentProtoPage.tsx olustur | Yasir | — | Yasir | Not Started | 2026-02-10 | 2026-02-13 | — | Frontend sayfasi | /dashboard/proto calisiyor | Dep: OPS-6 |
| S0.5.2-UX-3 | 0.5 | S0.5.2 | WS-UX | Getting Started karti | Dashboard'a onboarding karti ekle | Yasir | — | Yasir | Not Started | 2026-02-14 | 2026-02-16 | — | UI bileseni | Yeni kullanici yonlendirilmis | Dep: WL-2 |
| S0.5.3-QA-1 | 0.5 | S0.5.3 | WS-QA | Regression checklist | REGRESSION_CHECKLIST_S0.5.md olustur | Yasir | Ayse | Yasir | Not Started | 2026-02-24 | 2026-02-25 | — | QA dokumani | Her item pass/fail | Dep: AGT-3~5 |
| S0.5.3-QA-2 | 0.5 | S0.5.3 | WS-QA | Demo scripti | 15 dk canli demo akisi scripti | Yasir | Ayse | Yasir | Not Started | 2026-02-25 | 2026-02-26 | — | DEMO_SCRIPT_S0.5.md | 1x prova yapilmis | Dep: QA-1 |
| S0.5.3-QA-3 | 0.5 | S0.5.3 | WS-QA | QA evidence | Screenshot + pass/fail tablosu | Yasir | Ayse | Yasir | Not Started | 2026-02-26 | 2026-02-27 | — | QA_EVIDENCE_S0.5_PILOT.md | Tum golden path evidence | Dep: QA-2 |
| S0.5.3-QA-4 | 0.5 | S0.5.3 | WS-QA | Tez hazirlik notu | Tez bolum basliklari + outline | Ayse | Yasir | Yasir | Not Started | 2026-02-17 | 2026-02-21 | — | THESIS_OUTLINE_S0.5.md | Danismana gosterilebilir | — |

---

## CSV Bloku (Excel'e Paste Edilebilir)

Asagidaki CSV blogunu kopyalayip Excel'e yapistirabilirsiniz:

```csv
Gorev_ID,Faz,Sprint,Workstream,Baslik,Aciklama,Sorumlu,Destek,Reviewer,Durum,Plan_Baslangic,Plan_Bitis,Gercek_Bitis,Teslimat,Kabul_Kriteri,Not
S0.5.0-OPS-1,0.5,S0.5.0,WS-OPS,Frontend base URL fix,client.ts ve HttpClient.ts'de getApiBaseUrl() kullanimi,Yasir,,Yasir,Not Started,2026-02-07,2026-02-08,,Kod degisikligi (2 dosya),grep localhost:3000 dist/ = 0 sonuc,P0 BLOCKER
S0.5.0-OPS-2,0.5,S0.5.0,WS-OPS,Backend trust-proxy,env.ts'ye TRUST_PROXY ekle server.app.ts'de trustProxy ayarla,Yasir,,Yasir,Not Started,2026-02-07,2026-02-08,,Kod degisikligi (2 dosya),request.protocol=https Caddy arkasinda,P0 BLOCKER
S0.5.0-OPS-3,0.5,S0.5.0,WS-OPS,Staging env + OAuth callback,.env dogrulama GitHub OAuth App callback URL guncelleme,Yasir,,Yasir,Not Started,2026-02-08,2026-02-09,,Env konfigurasyon,OAuth login staging'de calisiyor,Dep: OPS-1 OPS-2
S0.5.0-OPS-4,0.5,S0.5.0,WS-OPS,Smoke test localhost check,staging_smoke.sh'a localhost leak kontrolu ekle,Yasir,,Yasir,Not Started,2026-02-08,2026-02-09,,Script guncelleme,Otomatik localhost leak detection,Dep: OPS-1
S0.5.0-OPS-5,0.5,S0.5.0,WS-OPS,DB migration ve health,Staging DB health check migration dogrulama,Yasir,,Yasir,Not Started,2026-02-07,2026-02-08,,Dogrulama raporu,/ready endpoint ready:true donuyor,
S0.5.0-OPS-6,0.5,S0.5.0,WS-OPS,Deploy + full smoke test,Staging'e deploy ve tum smoke test'leri calistir,Yasir,,Yasir,Not Started,2026-02-09,2026-02-09,,Deploy log + smoke raporu,6/6 smoke test pass,Dep: OPS-1~5
S0.5.1-WL-1,0.5,S0.5.1,WS-WAITLIST,Invite stratejisi,Email davet + acik signup stratejisi dokumante et,Yasir,Ayse,Yasir,Not Started,2026-02-10,2026-02-11,,Strateji dokumani,Takimca onaylanmis,Dep: OPS-6
S0.5.1-WL-2,0.5,S0.5.1,WS-WAITLIST,Onboarding flow,Signup->AI key->first job akisi ve Getting Started karti,Yasir,,Yasir,Not Started,2026-02-11,2026-02-14,,UI bileseni,Signup'tan ilk job'a 5 dk,Dep: OPS-6
S0.5.1-WL-3,0.5,S0.5.1,WS-WAITLIST,Feedback capture,FeedbackTab entegrasyonu thumbs up/down + metin,Yasir,,Yasir,Not Started,2026-02-14,2026-02-16,,UI + API endpoint,Job sonrasi geri bildirim calisiyor,Dep: WL-2
S0.5.1-AGT-1,0.5,S0.5.1,WS-AGENTS,Agent contract dokumani,3 ajan icin input/output schema + error codes,Yasir,,Yasir,Not Started,2026-02-14,2026-02-16,,docs/agents/AGENT_CONTRACTS_S0.5.md,Her ajan icin schema listelenmis,
S0.5.1-AGT-2,0.5,S0.5.1,WS-AGENTS,Playbook determinizm,temperature=0 seed prompt sabitleme kontrolu,Yasir,,Yasir,Not Started,2026-02-17,2026-02-18,,Playbook guncelleme,Ayni input -> ayni prompt,
S0.5.1-AGT-3,0.5,S0.5.1,WS-AGENTS,Scribe golden path,Staging'de dry-run documentation job dogrulama,Yasir,,Yasir,Not Started,2026-02-18,2026-02-20,,Test raporu,3 denemenin 2'si basarili,Dep: OPS-6 AGT-1
S0.5.1-AGT-4,0.5,S0.5.1,WS-AGENTS,Trace golden path,Spec text'inden test plani uretimi dogrulama,Yasir,,Yasir,Not Started,2026-02-18,2026-02-20,,Test raporu,3 denemenin 2'si basarili,Dep: OPS-6 AGT-1
S0.5.1-AGT-5,0.5,S0.5.1,WS-AGENTS,Proto golden path,Feature tanindan scaffold uretimi dogrulama,Yasir,,Yasir,Not Started,2026-02-18,2026-02-20,,Test raporu,3 denemenin 2'si basarili,Dep: OPS-6 AGT-1
S0.5.1-AGT-6,0.5,S0.5.1,WS-AGENTS,Hata handling standardizasyonu,5 hata senaryosu icin kullanici mesaji,Yasir,,Yasir,Not Started,2026-02-20,2026-02-21,,Error mapping kodu,5 senaryoda UI mesaj gosteriyor,Dep: AGT-1
S0.5.2-RAG-1,0.5,S0.5.2,WS-RAG,Research brief + karar,RAG secenekleri degerlendirmesi ve karar,Yasir,Ayse,Yasir,Not Started,2026-02-17,2026-02-18,,RESEARCH_BRIEF dosyasi,Karar kilitlenmis,
S0.5.2-RAG-2,0.5,S0.5.2,WS-RAG,Context pack dogrulama,ScribeAgent context toplama mekanizmasi test,Yasir,,Yasir,Not Started,2026-02-20,2026-02-21,,Dogrulama raporu,Context dogru toplaniyor,Dep: AGT-3
S0.5.2-UX-1,0.5,S0.5.2,WS-UX,Trace console sayfasi,DashboardAgentTracePage.tsx olustur,Yasir,,Yasir,Not Started,2026-02-10,2026-02-13,,Frontend sayfasi,/dashboard/trace calisiyor,Dep: OPS-6
S0.5.2-UX-2,0.5,S0.5.2,WS-UX,Proto console sayfasi,DashboardAgentProtoPage.tsx olustur,Yasir,,Yasir,Not Started,2026-02-10,2026-02-13,,Frontend sayfasi,/dashboard/proto calisiyor,Dep: OPS-6
S0.5.2-UX-3,0.5,S0.5.2,WS-UX,Getting Started karti,Dashboard'a onboarding karti ekle,Yasir,,Yasir,Not Started,2026-02-14,2026-02-16,,UI bileseni,Yeni kullanici yonlendirilmis,Dep: WL-2
S0.5.3-QA-1,0.5,S0.5.3,WS-QA,Regression checklist,REGRESSION_CHECKLIST_S0.5.md olustur,Yasir,Ayse,Yasir,Not Started,2026-02-24,2026-02-25,,QA dokumani,Her item pass/fail,Dep: AGT-3~5
S0.5.3-QA-2,0.5,S0.5.3,WS-QA,Demo scripti,15 dk canli demo akisi scripti,Yasir,Ayse,Yasir,Not Started,2026-02-25,2026-02-26,,DEMO_SCRIPT_S0.5.md,1x prova yapilmis,Dep: QA-1
S0.5.3-QA-3,0.5,S0.5.3,WS-QA,QA evidence,Screenshot + pass/fail tablosu,Yasir,Ayse,Yasir,Not Started,2026-02-26,2026-02-27,,QA_EVIDENCE_S0.5_PILOT.md,Tum golden path evidence,Dep: QA-2
S0.5.3-QA-4,0.5,S0.5.3,WS-QA,Tez hazirlik notu,Tez bolum basliklari + outline,Ayse,Yasir,Yasir,Not Started,2026-02-17,2026-02-21,,THESIS_OUTLINE_S0.5.md,Danismana gosterilebilir,
```

---

## Ozet Istatistikleri

| Metrik | Deger |
|--------|-------|
| Toplam gorev | 24 |
| WS-OPS (P0 Blocker) | 6 |
| WS-WAITLIST | 3 |
| WS-AGENTS | 6 |
| WS-RAG | 2 |
| WS-UX | 3 |
| WS-QA | 4 |
| Sprint S0.5.0 (7-9 Sub) | 6 gorev |
| Sprint S0.5.1 (10-21 Sub) | 12 gorev |
| Sprint S0.5.2 (10-23 Sub) | 5 gorev |
| Sprint S0.5.3 (24-28 Sub) | 4 gorev |
| P0 Blocker gorevler | 2 (OPS-1, OPS-2) |
| Kritik yol gorevleri | OPS-1 -> OPS-3 -> OPS-6 -> AGT-3 -> QA-1 -> QA-3 |

---

*Bu dosya `docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md` ile senkronize tutulmalidir.*
