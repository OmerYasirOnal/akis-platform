# Staging Smoke Checklist

Her staging deploy'dan hemen sonra kullanın.

## A) Health
- [ ] `GET /health` `200` ve `{"status":"ok"}` döner
- [ ] `GET /ready` `200` ve `{"ready":true}` döner
- [ ] `GET /version` `200` ve beklenen commit/version döner

## B) Auth
- [ ] Login sayfası konsol/runtime hatası olmadan yüklenir
- [ ] Geçerli login çalışır ve kimlik doğrulanmış alana yönlendirir
- [ ] Geçersiz login beklenen hata durumunu gösterir (crash yok)
- [ ] Kimlik doğrulanmış oturum bir sayfa yenilemesinden sonra devam eder

## C) Agent Yaşam Döngüsü
- [ ] Agent listesi sayfası açılır ve birincil kartlar görünür
- [ ] Bir basit çalıştırma (Scribe/Trace/Proto) başarıyla tamamlanır
- [ ] Run beklenen durumlardan geçer ve görünür durumla tamamlanır/başarısız olur
- [ ] Oluşturulan run için job detay sayfası açılır

## D) SSE
- [ ] Job/event stream tekrarlayan reconnect döngüsü olmadan bağlanır
- [ ] Run ilerlemesi sırasında canlı güncellemeler görünür
- [ ] Stream tamamlandıktan sonra düzgün kapanır/yeniden bağlanır

## E) Kapsam Dışı Kaldırma Doğrulaması
- [ ] Kapsam dışı navigasyon girişleri UI'da yok
- [ ] `/agents/smart-automations` özellik içeriği render etmez (404 veya redirect kabul edilir)
- [ ] Kaldırılan kapsam dışı özelliklere aktif API route'ları açık değil

## F) Negatif Testler
- [ ] Korumalı endpoint'e kimlik doğrulanmamış çağrı 401/403 döner (500 değil)
- [ ] Bilinmeyen route standart error envelope ile 404 döner
- [ ] Bir job endpoint'ine geçersiz payload validation hatası döner (crash değil)

## G) Loglar
- [ ] Backend logları deploy sonrası yeni hata patlaması içermez
- [ ] Smoke run sırasında tekrarlayan unhandled exception yok
- [ ] Request ve job logları beklenen tanımlayıcıları içerir (`requestId`, `jobId`)
