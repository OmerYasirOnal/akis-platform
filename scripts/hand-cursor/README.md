# Hand Cursor — El Hareketi ile Cursor Kontrolu

Webcam uzerinden el takibi yaparak cursor'u kontrol et: isaret parmagiyla hareket ettir, pinch ile tikla, scroll yap.

MediaPipe Hands + One Euro Filter + macOS Quartz ile tamamen local calisan, dusuk gecikmeli sistem.

## Nasil Calisir

```
Webcam goruntusunu yakala
  → MediaPipe Hands ile 21 el landmarki tespit et
    → Gesture tanima (pinch, scroll, fist)
      → One Euro Filter ile yumusat
        → Quartz CGEvent ile cursor hareket ettir
```

## Gesture Rehberi

| Gesture | Nasil Yapilir | Ne Yapar |
|---|---|---|
| Cursor hareketi | Isaret parmagini goster ve hareket ettir | Cursor isaret parmagini takip eder |
| Sol tikla | Basparmak + isaret parmagi birlestir (pinch) | Sol tikla |
| Sag tikla | Basparmak + orta parmak birlestir | Sag tikla |
| Scroll | Basparmak + yuzuk parmak birlestir, eli yukari/asagi hareket ettir | Sayfa kaydirma |
| Duraklat | Yumruk yap | Takip duraklar (false-positive onleme) |
| Devam | Elini ac | Takip devam eder |

## Gereksinimler

- **macOS 12+** (Monterey veya uzeri)
- **Python 3.10+** (pyobjc-framework-Quartz gerekliligi)
- **Webcam** (dahili veya harici)
- ~200 MB RAM kullanimi

## Kurulum

```bash
cd scripts/hand-cursor
chmod +x setup.sh
./setup.sh
```

Setup script:
1. Python 3.12 kontrol eder / kurar (brew)
2. `.venv/` sanal ortam olusturur
3. mediapipe, opencv, pyobjc-framework-Quartz kurar
4. Import dogrulamasi yapar

### macOS Izinleri (Zorunlu)

**System Settings > Privacy & Security:**

- **Camera** — webcam erisimi icin
- **Accessibility** — cursor kontrolu icin

## Kullanim

```bash
cd scripts/hand-cursor
source .venv/bin/activate
python hand_cursor.py
```

### Komut Satirlari

```
python hand_cursor.py              # Normal baslat (preview + cursor kontrolu)
python hand_cursor.py --preview    # Sadece onizleme (cursor kontrolu yok)
python hand_cursor.py --no-preview # Preview yok (sadece cursor kontrolu)
python hand_cursor.py --version    # Versiyon
python hand_cursor.py --help       # Yardim
```

### Calistirma Sirasinda Tuslar

- **q** — cikis
- **r** — smoother ve mapper sifirla

## Konfigurasyon

`config.yaml` dosyasini duzenle:

### Kamera

```yaml
camera:
  device: 0        # Webcam indeksi (0 = varsayilan)
  width: 640       # Dusuk cozunurluk = daha hizli
  height: 480
  fps: 30
```

### Gesture Esikleri

```yaml
gestures:
  pinch_threshold: 0.045    # Dusuk = daha hassas, yuksek = daha toleransli
  pinch_frames: 2           # Kac frame art arda pinch algilanmali
  fist_pause: true          # Yumruk = duraklat
```

### Cursor Hassasiyeti

```yaml
cursor:
  sensitivity: 1.8     # 1.0 = 1:1, 2.0 = 2x amplified hareket
  dead_zone: 3         # 3px'den kucuk hareketler ignore edilir
  screen_padding: 0.10 # Ekran kenarinda %10 dead zone
```

### Yumusatma (One Euro Filter)

```yaml
smoothing:
  min_cutoff: 1.5   # Dusuk = daha az jitter, daha cok lag
  beta: 0.5         # Yuksek = daha az lag, daha cok jitter
```

**Ayarlama ipucu:**
- Cursor cok titriyorsa → `min_cutoff` dusur (ornegin 0.8)
- Cursor yavas kaliyorsa → `beta` arttir (ornegin 1.0)

## Mimari

```
hand_cursor.py          # Ana daemon + main loop
  ├── gestures.py       # GestureDetector: pinch/fist/scroll tanima
  ├── smoothing.py      # CursorSmoother: One Euro Filter
  ├── calibration.py    # ScreenMapper: el → ekran koordinati
  └── config.yaml       # Tum ayarlar
```

### Bilesenler

| Modul | Sorumluluk |
|---|---|
| `gestures.py` | MediaPipe landmark → gesture siniflandirma (temporal stability ile) |
| `smoothing.py` | One Euro Filter: adaptif jitter azaltma + dead zone |
| `calibration.py` | Normalized el koordinati → ekran pikseli esleme |
| `hand_cursor.py` | Webcam yakalama, MediaPipe, gesture → cursor hareketi orkestrasyonu |

## Troubleshooting

### Webcam acilmiyor
- Baska uygulama kamerayi kullaniyor olabilir (FaceTime, Zoom kapat)
- `config.yaml`'da `camera.device` degerini degistir (0, 1, 2 dene)
- macOS Camera izni verildi mi kontrol et

### Cursor kontrolu calismiyor
- macOS Accessibility izni verildi mi?
- `--preview` moduyla test et (sadece goruntu)
- Quartz import hatasi aliyorsan Python 3.10+ gerekli

### El algilanmiyor
- Isik yeterli mi? Iyi aydinlatilmis ortamda calis
- Kameraya yakin otur (30-80 cm ideal)
- `tracking.detection_confidence` dusur (ornegin 0.5)

### Cursor cok titriyor
- `smoothing.min_cutoff` dusur (0.8-1.0)
- `cursor.dead_zone` arttir (5-10)
- Elini daha sabit tut

### Pinch algilanmiyor / yanlis algilaniyor
- `gestures.pinch_threshold` arttir (daha toleransli) veya dusur (daha hassas)
- `gestures.pinch_frames` arttir (3-4 = daha az false positive)

## Performans

| Metrik | M4 Pro Beklentisi |
|---|---|
| FPS | 30-60 |
| Algilama gecikmesi | ~15-30ms |
| Cursor gecikmesi | ~5ms |
| CPU kullanimi | %5-10 |
| RAM | ~200 MB |

## Lisans

AKIS Platform developer tooling — dahili kullanim.
