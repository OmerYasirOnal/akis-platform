# Jarvis — Voice-to-Cursor

Push-to-talk sesli komut sistemi: konuş, Cursor'a otomatik gönder.

Apple Silicon (M-series) için optimize edilmiş, tamamen local Whisper transkripsiyon ile çalışır.

## Nasıl Çalışır

```
Hotkey basılı tut → Konuş → Bırak → Whisper transkribe eder → Cursor'a gönderir
```

1. **Ctrl+Shift+Space** basılı tut — mikrofon açılır
2. Komutunu söyle (Türkçe, İngilizce, karışık)
3. Tuşu bırak — ses local Whisper ile metne dönüşür (~1 saniye)
4. Metin otomatik olarak Cursor IDE'de yeni chat olarak açılır

## Gereksinimler

- **macOS 12+** (Monterey veya üzeri)
- **Apple Silicon** (M1/M2/M3/M4)
- **Python 3.10+**
- **Homebrew** (`brew`)
- ~1.5 GB disk (Whisper model cache)

## Kurulum

```bash
cd scripts/voice-cursor
chmod +x setup.sh
./setup.sh
```

Setup script şunları yapar:
1. `ffmpeg` ve `portaudio` kurar (brew)
2. Python sanal ortam oluşturur (`.venv/`)
3. Gerekli Python paketlerini kurar
4. Whisper modelini ön-indirir

### macOS İzinleri (Zorunlu)

**System Settings > Privacy & Security** altında terminal uygulamanızı (Terminal.app / iTerm / Warp) şu listelere ekleyin:

- **Accessibility** — global hotkey algılama için
- **Input Monitoring** — klavye dinleme için
- **Microphone** — ses kaydı için

> Bu izinler verilmezse hotkey ve mikrofon çalışmaz.

## Kullanım

```bash
cd scripts/voice-cursor
source .venv/bin/activate
python voice_cursor.py
```

### Komut Satırı Seçenekleri

```
python voice_cursor.py              # Normal başlat
python voice_cursor.py --test-mic   # Mikrofon testi (3 saniye kayıt)
python voice_cursor.py --test-whisper  # Whisper testi (5 saniye kayıt + transkripsiyon)
python voice_cursor.py --version    # Versiyon göster
python voice_cursor.py --help       # Yardım
```

### Arka Planda Çalıştırma

```bash
nohup python voice_cursor.py &
```

## Konfigürasyon

`config.yaml` dosyasını düzenleyerek ayarları değiştirebilirsiniz:

### Hotkey

```yaml
hotkey:
  combo: ctrl+shift+space   # Basılı tut = kayıt, bırak = gönder
```

Kullanılabilir tuşlar: `ctrl`, `shift`, `alt`, `cmd`, `space`, `tab`, `f1`-`f12`, tekil harfler

### Whisper Model

```yaml
whisper:
  model: mlx-community/whisper-large-v3-turbo  # En iyi hız/kalite
  language: auto   # auto | tr | en
```

Mevcut modeller (hız/boyut sıralı):
| Model | Boyut | Hız | Kalite |
|-------|-------|-----|--------|
| `mlx-community/whisper-tiny` | ~74 MB | Çok hızlı | Düşük |
| `mlx-community/whisper-base` | ~140 MB | Hızlı | Orta |
| `mlx-community/whisper-small` | ~460 MB | Hızlı | İyi |
| `mlx-community/whisper-large-v3-turbo` | ~1.5 GB | Hızlı | Çok iyi |
| `mlx-community/whisper-large-v3` | ~3 GB | Yavaş | En iyi |

### Gönderim Modu

```yaml
dispatch:
  mode: ide     # ide: Cursor IDE keyboard sim | cli: agent CLI
  workspace: null
  cli_model: null
  cli_mode: null
```

**IDE modu** (varsayılan): Cursor IDE'ye Cmd+L ile yeni chat açar, prompt'u yapıştırır, Enter'a basar.

**CLI modu**: `agent "prompt"` komutuyla Cursor Agent CLI üzerinden gönderir. `CURSOR_API_KEY` veya `agent login` gerekebilir.

### Prompt Şablonu

```yaml
prompt:
  prefix: ""
  suffix: ""
  template: null   # Örnek: "AKIS projesinde, {text}"
```

`{text}` yer tutucusu transkripsiyon metniyle değiştirilir.

### Bildirimler

```yaml
notifications:
  sound: true    # Kayıt başladı/bitti ses efekti
  banner: true   # macOS bildirim banner'ı
```

## Troubleshooting

### "No audio captured"
- **Mikrofon izni** verildi mi? System Settings > Privacy > Microphone
- Harici mikrofon kullanıyorsan bağlı olduğundan emin ol
- `python voice_cursor.py --test-mic` ile test et

### Hotkey çalışmıyor
- **Accessibility** ve **Input Monitoring** izinleri verildi mi?
- Başka bir uygulamanın aynı hotkey'i kullanmadığından emin ol
- `config.yaml`'da farklı bir combo dene

### Transkripsiyon boş veya yanlış
- `--test-whisper` ile test et
- Mikrofon seviyesini kontrol et (`--test-mic` peak amplitude > 0.01 olmalı)
- `language: tr` veya `language: en` sabitleyerek dene

### Cursor'a gönderilmiyor
- **IDE modu**: Cursor uygulamasının açık ve ön planda olduğundan emin ol
- **CLI modu**: `agent --version` çalışıyor mu kontrol et
- Accessibility izni verildi mi?

### İlk çalıştırmada yavaş
- Normal — Whisper modeli ilk seferde indirilir (~1.5 GB)
- Sonraki çalıştırmalarda cache'den yüklenir

## Mimari

```
voice_cursor.py
├── HotkeyManager (pynput)     ← Global hotkey dinleme
├── AudioRecorder (sounddevice) ← Push-to-talk ses kaydı
├── transcribe_audio (mlx-whisper) ← Local AI transkripsiyon
├── format_prompt              ← Şablon/prefix/suffix uygulama
├── dispatch_ide (osascript)   ← Cursor IDE keyboard simulation
└── dispatch_cli (agent CLI)   ← Cursor Agent CLI gönderimi
```

## Lisans

AKIS Platform developer tooling — dahili kullanım.
