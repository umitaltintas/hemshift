# Shift Planner - Proje Gereksinimleri

## Proje Özeti

Hemşireler için aylık shift planlama uygulaması. Sorumlu hemşirenin personel yönetimi, izin girişi ve adaletli shift planı oluşturmasını sağlayan web tabanlı bir sistem.

## Kullanıcı Profili

- **Platform**: Web uygulaması
- **Kullanıcı Tipi**: Tek sorumlu hemşire (admin)
- **Ekip Büyüklüğü**: 5-10 hemşire (1 sorumlu + 4-9 staf)

## Personel Yapısı

### Sorumlu Hemşire
- Sistemde sadece 1 adet sorumlu hemşire bulunur
- **Kısıtlama**: Sadece 8 saatlik gündüz vardiyasında çalışır
- Staf sayısına dahil DEĞİLDİR
- İstatistiklerde ayrı gösterilir

### Staf Hemşireler
- Sistemde 4-9 staf hemşire bulunabilir
- Tüm vardiya tiplerinde çalışabilir:
  - 8 saatlik gündüz vardiyası
  - 16 saatlik gece vardiyası
  - 24 saatlik haftasonu/tatil vardiyası
- Adalet hesaplamaları sadece staf hemşireler için yapılır

## Vardiya Tipleri

### Hafta İçi Vardiyaları

#### Gündüz Vardiyası (8 saat)
- **Saat**: 08:00 - 16:00
- **Gereksinim**: 2 STAF + 1 SORUMLU = **3 kişi toplam**
- Sorumlu hemşire MUTLAKA bu vardiyada bulunmalı (izinde değilse)

#### Gece Vardiyası (16 saat)
- **Saat**: 16:00 - 08:00 (ertesi gün)
- **Gereksinim**: 2 STAF = **2 kişi**
- Sorumlu hemşire bu vardiyada BULUNAMAZ

### Haftasonu/Tatil Vardiyası

#### 24 Saatlik Vardiya
- **Saat**: 00:00 - 24:00
- **Gereksinim**: 2 STAF = **2 kişi**
- Sadece Cumartesi, Pazar ve resmi tatil günlerinde
- Sorumlu hemşire genellikle bu vardiyada BULUNMAZ

## Planlama Dönemi

- **Periyot**: Aylık
- **Başlangıç**: Her ayın 1'i
- **Planlama Süreci**:
  1. Önceki ay sonunda yeni ay için plan oluşturulur
  2. Otomatik algoritma ile taslak plan üretilir
  3. Sorumlu hemşire manuel düzenlemeler yapar
  4. Plan yayınlanır

## İzin Tipleri

### 1. Yıllık İzin
- Planlanmış izinler
- Birkaç gün veya hafta sürebilir
- Önceden sisteme girilir

### 2. Mazeret İzni
- Acil durumlar için kısa süreli izin
- Genellikle 1-2 gün

### 3. Raporlu
- Sağlık raporu ile izin
- Süre değişken

### 4. Boşluk Tercihi
- Zorunlu izin değil
- Hemşirenin tercih ettiği boş günler
- Algoritma mümkünse bu tercihleri dikkate alır
- Diğer izin tiplerine göre daha düşük öncelik

## Adalet Kriterleri

Algoritma aşağıdaki kriterlere göre adaleti sağlar (SADECE STAF HEMŞİRELER için):

### 1. Eşit Gece Nöbeti Dağılımı
- Her staf hemşire yaklaşık aynı sayıda gece nöbeti çeker
- Hedef: Standard sapma < 1 shift

### 2. Eşit Haftasonu Çalışması
- Haftasonu vardiyaları dengeli dağıtılır
- Hedef: Standard sapma < 1 shift

### 3. Eşit Toplam Saat
- Her staf hemşire yaklaşık aynı toplam saatte çalışır
- Hedef: Standard sapma < 8 saat

### 4. Dinlenme Periyotları
- **Gece sonrası dinlenme**: Gece vardiyasından sonra en az 1 gün dinlenme
- **Ardışık çalışma limiti**: Maksimum 5 gün üst üste çalışma
- **Ardışık gece limiti**: Maksimum 3 gece üst üste

## Kısıtlamalar (Hard Constraints)

Bu kurallar MUTLAKA sağlanmalı, aksi takdirde plan geçersizdir:

1. ✅ Her vardiyada minimum personel sayısı sağlanmalı
   - Gündüz: Min 2 staf + 1 sorumlu
   - Gece/Haftasonu: Min 2 staf

2. ✅ İzinli hemşireler vardiyaya atanamaz

3. ✅ Sorumlu hemşire SADECE 8 saatlik gündüz vardiyasında çalışabilir

4. ✅ Gece vardiyasından sonra aynı hemşire ertesi gün çalışamaz

5. ✅ Aynı gün aynı hemşire birden fazla vardiyaya atanamaz

## Yazılım Gereksinimleri

### Fonksiyonel Gereksinimler

1. **Hemşire Yönetimi**
   - Hemşire ekleme/düzenleme/silme
   - Sorumlu/staf rolü atama
   - Sadece 1 sorumlu hemşire olabilir

2. **İzin Yönetimi**
   - İzin ekleme/düzenleme/silme
   - İzin tipi seçimi (yıllık, mazeret, raporlu, tercih)
   - Tarih aralığı belirleme

3. **Shift Planlama**
   - Otomatik plan oluşturma (algoritma)
   - Manuel düzenleme (drag & drop)
   - Plan validasyonu
   - Uyarı ve hata mesajları

4. **İstatistikler**
   - Hemşire bazlı çalışma saati özeti
   - Gece nöbeti sayıları
   - Haftasonu çalışma sayıları
   - Adalet skoru gösterimi

5. **Export**
   - Excel formatında export
   - CSV formatında export

### Non-Fonksiyonel Gereksinimler

1. **Performans**
   - Plan oluşturma < 5 saniye
   - UI responsive (< 100ms)

2. **Kullanılabilirlik**
   - Türkçe arayüz
   - Sezgisel UI/UX
   - Mobile-friendly

3. **Güvenilirlik**
   - Offline çalışabilme (hibrit)
   - Otomatik kaydetme
   - Veri yedekleme

4. **Güvenlik**
   - Authentication (Supabase)
   - Data encryption
   - Secure API endpoints

## Başarı Kriterleri

1. ✅ Plan oluşturma başarı oranı > 95%
2. ✅ Adalet skoru > 80/100
3. ✅ Kullanıcı memnuniyeti (SUS skoru > 70)
4. ✅ Sistem uptime > 99%

## Gelecek Özellikler (v2.0)

- Çoklu departman desteği
- Hemşirelerin kendi portalı (self-service izin talebi)
- Mobil uygulama (iOS/Android)
- Push notification (vardiya hatırlatmaları)
- Shift swap özelliği (hemşireler arası değişim)
- AI-powered tahminleme (hastalık, izin patternleri)
- WhatsApp entegrasyonu
