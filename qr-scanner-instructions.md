# QR Scanner Kamera Optimizasyonu - Teknik Gereksinimler

## Problem Tanımı

QR tarayıcı bileşeni şu anda ultra geniş açı kamera ile başlatılıyor. Bu durumun iki temel sorunu var:

1. **Düşük Çözünürlük**: Ultra geniş açı kameralar genellikle daha düşük sensör çözünürlüğüne sahiptir
2. **Format Uyumsuzluğu**: Tarama UI'ı 1:1 (kare) format kullanıyor, ancak ultra geniş açı kameralar 21:9 veya 16:9 aspect ratio ile çalışıyor

## Teknik Analiz

### Mevcut Durum

- `getUserMedia` API'sine `facingMode: "environment"` constraint'i verildiğinde, bazı cihazlar ultra geniş açı kamerayı seçiyor
- Bu davranış özellikle çoklu arka kamera sistemine sahip Android cihazlarda yaygın
- WebRTC standardı, birden fazla uygun kamera olduğunda hangisinin seçileceğini garanti etmiyor

### Kamera Seçim Öncelikleri

Modern mobil cihazlarda tipik arka kamera yapısı:
- **Ultra Wide (0.5x)**: ~120° FOV, düşük çözünürlük, 21:9 aspect ratio
- **Main/Wide (1x)**: ~80° FOV, yüksek çözünürlük, 4:3 veya 16:9 aspect ratio  
- **Telephoto (2x-3x)**: ~50° FOV, değişken çözünürlük, 4:3 aspect ratio

QR kod okuma için ideal seçim: **Main/Wide kamera**

## Çözüm Önerisi

### Hedef Spesifikasyonlar

Tarama alanı 1:1 kare format olduğu için, kamera constraint'lerini buna optimize etmek gerekiyor:

1. **Aspect Ratio**: 1:1 (kare) format tercih edilmeli
   - Ultra geniş açı kameralar bu formatı desteklemez → elenir
   - Ana kamera 1:1 crop yapabilir veya en yakın formatı sağlar

2. **Çözünürlük**: 1280x1280 veya daha yüksek
   - QR kod okuma için yeterli detay sağlar
   - Ultra geniş açı kameralar genelde bu kare çözünürlüğü desteklemez

3. **Constraint Tipi**: `ideal` parametresi kullanılmalı
   - `exact` yerine `ideal` kullanarak geniş cihaz uyumluluğu sağlanır
   - Cihaz tam olarak desteklemese bile en yakın değeri döner

### Fallback Stratejisi

Multi-tier fallback mekanizması önerilir:

**Tier 1**: Optimal constraint'ler (1:1 aspect ratio + yüksek çözünürlük)  
**Tier 2**: Sadece `facingMode: "environment"` (temel arka kamera)  
**Tier 3**: Constraint'siz (herhangi bir kamera)

Bu yaklaşım şunları garanti eder:
- Hiçbir cihazda kamera erişimi tamamen başarısız olmaz
- Her cihaz için en iyi olası kamera seçilir
- Uyumluluk sorunları minimize edilir

## Teknik Gereksinimler

### 1. MediaStreamConstraints Optimizasyonu

`getUserMedia` çağrısında kullanılacak constraint'ler:

**Birincil Constraint Seti:**
- `facingMode`: "environment" (arka kamera)
- `width`: ideal olarak 1280 veya üzeri
- `height`: ideal olarak 1280 veya üzeri (kare format için)
- `aspectRatio`: ideal olarak 1.0 (1:1 kare)

**Neden Bu Değerler:**
- 1280x1280: Modern QR kod okuma için optimal, çoğu cihazda destekleniyor
- 1:1 aspect ratio: UI ile uyumlu, ultra geniş açıyı filtreler
- `ideal` flag: Esneklik sağlar, hard constraint yerine tercih belirtir

### 2. Error Handling İyileştirmesi

Mevcut kod tek fallback seviyesine sahip. Önerilen yapı:

```
try {
  // Tier 1: Optimal constraints
} catch {
  try {
    // Tier 2: Basic environment camera
  } catch {
    // Tier 3: Any available camera
  }
}
```

Her tier'da farklı hata mesajları kullanılabilir (opsiyonel).

### 3. Cihaz Uyumluluğu Testleri

Değişiklik sonrası test edilmesi gereken senaryolar:

**Mobil Cihazlar:**
- [ ] Android (Samsung, Xiaomi, Huawei vb.) - çoklu kamera sistemleri
- [ ] iOS (iPhone 11 ve üzeri) - triple kamera sistemleri
- [ ] Budget Android cihazlar - tek kamera sistemleri

**Tarayıcılar:**
- [ ] Chrome Mobile
- [ ] Safari Mobile  
- [ ] Samsung Internet
- [ ] Firefox Mobile

**Test Kriterleri:**
- Kamera başarıyla açılıyor mu?
- Ana kamera mı yoksa ultra geniş açı mı seçiliyor? (EXIF metadata ile kontrol edilebilir)
- QR kod okuma başarı oranı nasıl?
- Çözünürlük yeterli mi?

## İlgili Dosyalar

**Component:** `qr-scanner-dialog.tsx`  
**Hedef Fonksiyon:** `initializeScanner` 
**Değiştirilecek Kod Bloğu:** `getUserMedia` çağrısı ve constraint tanımı

## Alternatif Yaklaşımlar (Daha Az Önerilir)

1. **Device Enumeration**: `enumerateDevices()` ile tüm kameraları listele ve manuel seçim yap
   - ❌ Her üreticinin farklı label formatı var
   - ❌ Daha karmaşık kod
   - ❌ Privacy concern (permission gerektiriyor)

2. **Exact Constraints**: `exact` flag kullanarak 1:1 aspect ratio zorla
   - ❌ Bazı cihazlarda tamamen başarısız olabilir
   - ❌ Daha düşük uyumluluk

3. **4:3 Aspect Ratio**: 1:1 yerine 4:3 kullan
   - ⚠️ UI crop işlemi gerektirir
   - ⚠️ Hala ultra geniş açı seçilebilir

## Beklenen Sonuçlar

✅ Ana kamera (main/wide) varsayılan olarak seçilir  
✅ Daha yüksek çözünürlük ve daha iyi QR kod okuma  
✅ 1:1 UI formatı ile uyumlu video stream  
✅ Geniş cihaz desteği korunur  
✅ Graceful degradation ile zero-failure garantisi  

## Referanslar

- [MDN: MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
- [W3C Media Capture Spec](https://www.w3.org/TR/mediacapture-streams/)
- [WebRTC Camera Selection Best Practices](https://webrtc.github.io/samples/src/content/getusermedia/resolution/)