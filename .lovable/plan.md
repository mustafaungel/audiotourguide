
Guide kartlarındaki sorunun kökü şu: başlık şu an üst bantta tek satıra zorlanıyor (`truncate`). Bu yüzden bazı kartlarda sığsa bile, daha uzun başlıklarda veya dar alanlarda mutlaka kesiliyor. “Hiç bir şekilde taşma yaratmayacak” mantığı için tek satır yaklaşımını bırakıp güvenli çok satırlı başlık düzenine geçmek en doğru çözüm.

## Yapılacak çözüm

### 1. GuideCard başlığını tek satırdan güvenli 2 satıra çevir
Dosya: `src/components/GuideCard.tsx`

Mevcut yapı:
- `truncate`
- tek satır
- dar kartlarda kesiliyor

Yeni yapı:
- `truncate` kaldırılacak
- yerine `line-clamp-2`
- `break-words` / `min-w-0` ile taşma engellenecek
- ikon üstte hizalanacak (`items-start`), böylece 2 satırlı başlık doğal görünecek
- üst bant yüksekliği biraz artırılacak

Önerilen mantık:
- Başlık en fazla 2 satır gösterilsin
- 2 satırı aşarsa kontrollü şekilde kırılsın
- yatay taşma hiç oluşmasın

### 2. Üst band layout’unu 2 satırlı başlığa uygun hale getir
Dosya: `src/components/GuideCard.tsx`

Şu an bant:
- ortalanmış kısa satır başlık mantığında

Güncellenecek:
- `items-center` yerine `items-start`
- başlık kapsayıcısına `flex-1 min-w-0 leading-tight line-clamp-2`
- padding biraz artırılacak (`py-2.5` gibi)
- gerekiyorsa ikon biraz küçültülüp sabit bırakılacak

Bu sayede:
- uzun başlıklar ezilmez
- ikon başlığın yanında düzgün kalır
- mobilde daha premium görünür

### 3. Gerekirse görsel alanı çok az optimize et
Dosya: `src/components/GuideCard.tsx`

Eğer 2 satırlı başlık sonrası kart fazla sıkışık görünürse:
- içerik bölümündeki dikey boşluklar hafif sadeleştirilecek
- ama ana çözüm başlık bölümünde yapılacak, kartın genel kimliği bozulmayacak

### 4. Bu değişiklik tüm GuideCard kullanım yerlerine yayılmış olacak
Aynı component kullanıldığı için şu sayfalar otomatik düzelecek:
- `src/pages/Index.tsx`
- `src/pages/Guides.tsx`
- `src/pages/CountryDetail.tsx`
- `src/components/FeaturedGuides.tsx`

Yani tek tek her sayfada ayrıca başlık fix’i yapmaya gerek kalmayacak.

## Neden bu çözüm en doğrusu?

Tek satır + küçültme yaklaşımı sorunu tamamen çözmez. Çünkü:
- bazı başlıklar yine uzun kalır
- carousel ve grid genişlikleri farklıdır
- mobilde 390px genişlikte güvenli çözüm ancak çok satırlı kontrollü başlıktır

En sağlam mantık:
```text
tek satır zorlaması → kaldır
2 satır kontrollü sarma → ekle
horizontal overflow → tamamen engelle
```

## Teknik özet

Değişecek ana dosya:
- `src/components/GuideCard.tsx`

Planlanan başlık mantığı:
```text
Top band
[icon] [title wraps up to 2 lines]

title classes:
- flex-1
- min-w-0
- line-clamp-2
- break-words
- leading-tight
- drop-shadow-sm
```

Beklenen sonuç:
- başlık hiçbir durumda yatay taşma yapmaz
- uzun isimler daha doğal görünür
- mobil görünüm çok daha dengeli olur
- tüm guide kartları tek seferde düzelir
