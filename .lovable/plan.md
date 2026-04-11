
## Düzeltme: Guide Detail sayfasındaki “listening now” badge’i hâlâ uzuyor

### Gerçek problem
Ekran görüntüsüne göre artık asıl sorun gradient’in köşeden taşması değil. Sorun şu:

- `GuideDetail` içinde badge, `flex flex-col` bir kolonun çocuğu
- bu kolon içinde child elemanlar default olarak cross-axis’te `stretch` olur
- yani badge içerik kadar değil, kolonun genişliği kadar uzuyor
- bu yüzden “52 listening now” metni bittikten sonra sağda boş, renkli bir pill kuyruğu oluşuyor

Kısacası:
```text
sorun = overflow değil
sorun = badge'in flex item olarak gereksiz şekilde genişlemesi
```

### Yapılacak çözüm
`LiveListenersBadge` badge varyantını içerik kadar genişleyen bir elemana çevireceğim:

- dış kapsayıcıya `w-fit` + `self-start`
- iç kapsayıcıya da `w-fit`
- mevcut `max-w-full` korunacak
- metin kısmında `truncate` korunacak
- gerekirse metne `min-w-0 whitespace-nowrap` eklenerek tek satırlı pill mantığı sabitlenecek

Böylece badge:
- Guide Detail’de artık kolon boyunca uzamaz
- sadece içerik kadar genişler
- AudioAccess gibi başka kullanım yerlerinde de bozulmaz

### Değişecek dosya
- `src/components/LiveListenersBadge.tsx`

### Uygulama mantığı
Mevcut badge yapısı:
```text
[parent flex-col]
  [LiveListenersBadge] -> stretch olduğu için fazla genişliyor
```

Yeni mantık:
```text
[parent flex-col]
  [LiveListenersBadge self-start + w-fit] -> sadece içeriği kadar genişlik
```

### Teknik detay
Planlanan class mantığı:
```tsx
outer:
inline-flex w-fit max-w-full self-start rounded-full overflow-hidden ...

inner:
inline-flex w-fit max-w-full items-center ...

text:
min-w-0 truncate whitespace-nowrap
```

### Neden bu çözüm doğru?
Önceki değişiklikler badge’in iç taşmasını ve gradient clipping problemini hedefliyordu. Ama yeni görseldeki problem, badge’in kendisinin fazla genişlemesi. Bu yüzden doğru katmanda çözüm:

- `overflow-hidden` = köşe dışı bleed’i çözer
- `max-w-full` = dar ekranda sınırı korur
- `w-fit + self-start` = gereksiz yatay uzamayı bitirir

### Performans
Bu da tamamen CSS seviyesinde bir düzenleme olacak:
- ek JS yok
- ek state yok
- render maliyeti yok
- performans etkisi pratikte sıfır

### Beklenen sonuç
- “listening now” pill’i metnin bittiği yerde bitecek
- sağ tarafta boş gradient kuyruk görünmeyecek
- light/dark theme’de aynı şekilde düzgün duracak
- mobil genişlikte daha temiz ve premium görünecek
