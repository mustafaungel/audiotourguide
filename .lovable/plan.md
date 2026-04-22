
## Plan: Auto Create Audio Guide İçin “Balloon Flight Mode”u Yönsüz, Genel Bilgi Odaklı Hale Getirme

### Hedef
Auto Create akışına özel bir **Balloon Flight Mode** eklenecek, ancak bu mod:
- yönlendirme yapmayacak
- anlık konum / yükseklik / sağ-sol gibi ifadeler kullanmayacak
- uçuşun herhangi bir anında dinlenebilecek **genel bilgi odaklı** bir audio guide üretecek
- tek uzun section mantığında çalışacak
- özellikle Cappadocia için vadiler, jeoloji, tarih, kültür ve deneyim bilgisini eksiksiz kapsayacak

Bu yaklaşım, gerçek uçuş rotası değişse bile rehberi güvenli ve doğru tutar.

---

## 1. Auto Create formuna yeni “Guide Type” alanı
`src/components/AutoCreateGuide.tsx` içinde mevcut standart akış korunacak, yanına yeni bir mod eklenecek:

- **Standard Tour**
  - mevcut çoklu section mantığı
- **Balloon Flight Experience**
  - tek uzun section
  - genel bilgi odaklı anlatım
  - rota bağımsız içerik
  - yön tarif etmeyen narrasyon

### Balloon mode için yeni alanlar
- **Experience Name**
- **Region / Destination**
- **Covered Valleys** (çoklu seçim)
  - Göreme Valley
  - Soğanlı Valley
  - Ihlara Valley
  - Çat Valley
- **Flight Theme**
  - Geological story
  - Historical and cultural story
  - Balanced overview
  - Premium storytelling
- **Estimated Listening Length**
  - 10 / 15 / 20 / 25 dk
- **Include intro/outro notes**
  - opsiyonel

Not: “pilot voice” ifadesi yerine daha güvenli ve doğru bir tanım kullanılacak:
- **Balloon experience narrator**
- profesyonel, sakin, premium
- ama uçuşu yöneten kişi gibi anlık komut veren bir ton olmayacak

---

## 2. Section planner’da balloon mode için ayrı branch
`supabase/functions/plan-guide-sections/index.ts` içinde yeni bir mod eklenecek.

### Standard mode
- aynen korunur

### Balloon mode
- planner tam olarak **1 section** döndürür
- bu section bir yürüyüş rotası gibi değil, tek parça uzun bir anlatı olur
- plan alanları buna göre şekillenir:
  - introduction
  - geological foundations
  - valley-by-valley overview
  - historical and cultural context
  - hidden details most guests miss
  - closing reflection

### Balloon mode için temel plan kuralları
- sağınızda, solunuzda, altınızda, önünüzde gibi yönsel anlatım yasak
- şu an yükseliyoruz, şu an şu kadar yüksekteyiz gibi anlık durum anlatımı yasak
- next stop / move forward / step closer gibi yürüyüş dili yasak
- içerik “uçuş sırasında herhangi bir anda dinlenebilir” yapıda olmalı
- seçilen vadilerin hepsi anlamlı biçimde kapsanmalı
- hidden gems ve daha az bilinen detaylar da mutlaka dahil edilmeli

---

## 3. Script generation için yeni prompt branch
`supabase/functions/generate-section-script/index.ts` içinde mevcut güçlü prompt korunacak, balloon mode için ayrı bir prompt branch eklenecek.

### Yeni anlatım karakteri
Balloon mode’da anlatıcı:
- bilgili, rafine, premium bir Cappadocia anlatıcısı olur
- sakin ve güven verici bir tonda konuşur
- fakat anlık pilot yönlendirmesi yapmaz
- rehberlik ederken “genel anlatı” kurar

### Prompt kuralları
Balloon mode prompt’una şu net kısıtlar eklenecek:
- **No directional language**
  - no left, right, below, ahead, behind, above you
- **No live flight claims**
  - no current altitude, current wind, current route, current visibility
- **No walking guidance**
  - no step closer, turn around, move to the next stop
- **No false immediacy**
  - içerik bulunduğu anı varsaymaz
- **General information first**
  - jeoloji, tarih, manastır yaşamı, kaya oyma kültürü, tarım, güvercinlikler, vadilerin karakter farkları
- **Evergreen narration**
  - rota değişse bile yanlış olmayacak cümleler
- **Single-flow long-form script**
  - tek section içinde paragraf bazlı ritim
  - TTS için kısa bloklar ve nefes alan yapı

### Balloon mode için örnek anlatım yaklaşımı
İçerik şu tipte olacak:
- Kapadokya’nın volkanik oluşumu
- tüf ve erozyonun peri bacalarını nasıl yarattığı
- seçilen vadilerin ayrı karakterleri
- insanların bu coğrafyaya nasıl uyumlandığı
- kaya oyma kiliseler, güvercinlikler, tarım ve yaşam kültürü
- balloon experience’i özel yapan atmosfer
- popüler bilgi + hidden gems dengesi

Yani anlatım “şu anda şuradasınız” değil, “bu coğrafyanın neden eşsiz olduğu” üzerine kurulacak.

---

## 4. Cappadocia için özel bilgi çerçevesi
Balloon mode’da Cappadocia seçildiğinde sistem daha zengin içerik üretmeli.

### Zorunlu bilgi eksenleri
- Hasan Dağı ve Erciyes gibi volkanik geçmiş
- tüf kaya yapısı ve erozyon
- peri bacalarının oluşumu
- kaya oyma yaşam ve manastır kültürü
- güvercinlikler ve tarımsal kullanım
- vadiler arası farklar
- turizmden önceki yerel yaşam
- fotoğrafik ve kültürel ün
- çok bilinen yerler + hidden gems

### Vadi bazlı minimum kapsama
Seçilen her vadi için sistem şu 4 şeyi üretmeli:
- neden önemli
- görsel / coğrafi karakteri
- tarihsel / kültürel bağı
- diğer vadilerden farkı

Bu sayede sadece “liste gibi bilgi” değil, derin ve profesyonel bir anlatı çıkar.

---

## 5. Suggestion sistemini güçlendirme
Şu an `suggest-cities` ve `suggest-attractions` fazla yüzeysel. Balloon mode ile birlikte bunlar da iyileştirilecek.

### `supabase/functions/suggest-cities/index.ts`
Genişletilecek:
- yalnızca şehir değil, **destination region** mantığı da desteklenecek
- örnek: Cappadocia bir şehir değil, bölgesel destinasyon olarak da önerilebilmeli
- top 30 yerine daha kapsamlı ve turizm odaklı sonuçlar
- city / region / tourism hub ayrımı

### `supabase/functions/suggest-attractions/index.ts`
Daha zengin çıktı verecek:
- Major Highlights
- Experiences
- Valleys / Scenic Areas
- Historical Sites
- Hidden Gems

Mevcut `SuggestedAttraction` yapısı korunabilir, ama açıklamalar ve tipler daha kaliteli hale getirilecek. Gerekirse UI içinde kategori rozetleriyle gruplanacak.

### UI geliştirmesi
`AutoCreateGuide.tsx` içinde attraction listesi:
- daha fazla sonuç göstermeli
- sadece tek satır değil, daha açıklayıcı görünmeli
- hidden gem / valley / experience gibi ayrımları belli etmeli

---

## 6. Review ekranlarını balloon mode’a uyarlama
`AutoCreateGuide.tsx` içindeki review adımları balloon mode için özelleştirilecek.

### Plan review
- “1 long section”
- tahmini dakika
- seçilen vadiler
- content theme
- hidden gems coverage notu

### Script review
- toplam kelime ve tahmini dakika
- script çok kısa ise uyarı
- seçilen vadiler kapsanmış mı kontrol listesi
- directional/live-flight dil tespiti için basit uyarı mantığı
  - örn. left, right, below, above, currently, now flying gibi kelimeler için warning

### Audio upload
- tek section olduğundan daha sade akış
- uzun tek MP3 veya çoklu MP3 merge desteği korunur

---

## 7. Görsel üretim mantığı
`generate-image` çağrısı balloon mode’da farklı prompt kullanmalı:
- editorial-grade Cappadocia balloon atmosphere
- geniş manzara
- premium travel hissi
- aşırı literal cockpit/pilot görseli değil
- genel deneyim hissi veren kapak

---

## 8. Teknik değişiklikler
### `src/components/AutoCreateGuide.tsx`
Eklenecek state alanları:
- `guideType`
- `coveredValleys`
- `flightTheme`
- `estimatedListeningMinutes`
- `includeIntroOutroNotes`

Fonksiyon çağrıları genişletilecek:
- `plan-guide-sections`
- `generate-section-script`

Yeni request yapısı:
```text
{
  mode: "standard" | "balloon",
  country,
  city,
  place,
  category,
  covered_valleys: string[],
  flight_theme: string,
  estimated_listening_minutes: number,
  include_intro_outro_notes: boolean
}
```

### `supabase/functions/plan-guide-sections/index.ts`
- mode destekleyecek
- standard ve balloon ayrılacak
- balloon mode tam 1 section döndürecek

### `supabase/functions/generate-section-script/index.ts`
- mode destekleyecek
- balloon için yeni prompt branch eklenecek
- yönsel ve anlık ifadeleri açıkça yasaklayacak

### `supabase/functions/suggest-cities/index.ts`
- region/destination hub mantığı eklenecek
- daha kapsamlı turizm önerileri üretilecek

### `supabase/functions/suggest-attractions/index.ts`
- hidden gems ve valleys kapsamı artırılacak
- exhaustive mantık güçlendirilecek

---

## 9. Etkilenmeyecek alanlar
Aşağıdakiler bozulmadan kalacak:
- mevcut Standard Tour auto create akışı
- manuel guide creation
- access page
- player sistemi
- mevcut yayınlanmış guide’lar
- mevcut çoklu section rehber mantığı

---

## 10. Doğrulama
Uygulama sonrası şu kontroller yapılacak:
1. Standard mode aynı şekilde çalışıyor
2. Balloon mode 1 section plan üretiyor
3. Script uzun ama yönsüz ve genel bilgi mantığında kalıyor
4. left/right/now/current altitude gibi ifadeler çıkmıyor
5. Cappadocia için seçilen vadilerin hepsi içerikte kapsanıyor
6. Suggestion listesi daha kapsamlı ve hidden gems içeren sonuçlar veriyor
7. Audio upload tek uzun section ile sorunsuz çalışıyor

## Sonuç
Bu revizyonla Balloon Flight Mode:
- daha güvenilir
- daha gerçekçi
- rota bağımsız
- operasyonel olarak daha doğru
- misafire premium ama yanıltmayan bir bilgi deneyimi sunan
bir yapıya dönüşecek.
