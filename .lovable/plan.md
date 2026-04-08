
Sorunun mantığını gördüm: problem büyük ihtimalle sadece bağlı guide senaryosunda çünkü MiniPlayer şu an `BottomSheet` içindeki `footer` slot’una portal ediliyor, ama o footer hâlâ `transform: translateY(...)` ile hareket eden sheet container’ının içinde. Yani half snap açıkken player sheet’in alt kenarına yapışıyor, viewport’un altına değil; bu yüzden çok aşağıda kalıyor, kesiliyor veya anlamsız görünüyor. Attığınız ekran görüntüsü de bunu doğruluyor.

## Ne düzelteceğim

### 1) MiniPlayer’ı sheet’in içinden tamamen çıkaracağım
`bottom-sheet-footer` yaklaşımını kaldıracağım.

Bunun yerine:
- linked guide içindeki MiniPlayer, `document.body` üzerine portal ile render edilecek
- ekranda gerçek anlamda `fixed bottom-0` davranacak
- yani standalone player ile aynı mantıkta çalışacak

Bu, “sheet’in altında kalma / kesilme” problemini kökten çözer.

### 2) BottomSheet içeriğine player kadar güvenli boşluk bırakacağım
MiniPlayer artık viewport’a sabitleneceği için, sheet içeriğinin altı player’ın altında kalmamalı.

Bu yüzden:
- `BottomSheet` scroll alanına bağlı-guide player aktifken alt padding eklenecek
- böylece son chapter kartları player’ın arkasında kalmayacak

Yaklaşım:
- `BottomSheet`e opsiyonel bir `footerOffset` veya `bottomInset` prop eklemek
- linked guide player açıkken bu değeri artırmak

### 3) Linked guide içinde MiniPlayer/ExpandedPlayer katman sırasını sadeleştireceğim
Şu an sistem karışık:
- MiniPlayer bazen inline
- bazen sheet footer portal
- ExpandedPlayer body portal

Bunu tek düzene indireceğim:
- MiniPlayer: body portal
- ExpandedPlayer: body portal
- Chapter list: sheet içinde kalır

Bu, mobil davranışı öngörülebilir hale getirir.

### 4) Hızlı kontrol tuşlarını koruyacağım ama sıkışmayı azaltacağım
MiniPlayer’daki:
- geri 15 sn
- play/pause
- ileri 15 sn
- hız butonu
korunacak.

Ama layout daha güvenli olacak:
- başlık alanı minimum genişlik alacak
- kapak görseli varsa mobilde daha küçük tutulacak
- gerekirse speed butonu daha kompakt hale getirilecek
- taşma ihtimaline karşı kontrol grubu `shrink-0`, metin alanı `min-w-0` mantığıyla korunacak

## Dokunacağım dosyalar

### `src/components/NewSectionAudioPlayer.tsx`
- linked guide modunda MiniPlayer’ı sheet footer yerine `document.body` portalına taşıyacağım
- `portalTarget` mantığını `bottom-sheet-footer` bağımlılığından çıkaracağım
- player görünürken sheet içeriği için alt boşluk bilgisini yukarı iletecek yapıyı hazırlayacağım

### `src/components/ui/bottom-sheet.tsx`
- footer slot yaklaşımını kaldıracağım veya pasif hale getireceğim
- content alanına opsiyonel alt inset/padding desteği ekleyeceğim
- böylece player açıkken içerik onun arkasında kalmayacak

### `src/components/MultiTabAudioPlayer.tsx`
- linked guide sheet açılırken gerekli alt inset bilgisini vereceğim
- standalone rehber davranışını hiç bozmadan sadece sheet akışını güncelleyeceğim

### `src/components/MiniPlayer.tsx`
- mobil düzeni hafifçe sıkılaştıracağım
- kontrollerin taşmadan görünmesi için spacing ve genişlikleri optimize edeceğim

## Neden bu yaklaşım daha güvenli
Bu çözüm mevcut semptomu “biraz yukarı iterek” maskelemiyor; doğrudan yanlış katmanda render edilen player’ı doğru katmana taşıyor. Böylece:
- yeni linked guide’larda da otomatik doğru davranır
- snap state değişse bile player sabit kalır
- standalone player bozulmaz
- ExpandedPlayer ile aynı overlay mimarisine yaklaşılmış olur

## Teknik not
Mevcut kök neden:
```text
BottomSheet = fixed + transform
MiniPlayer footer = BottomSheet'in içinde
=> bottom: 0, viewport'a değil transformed parent'a göre çalışıyor
=> half/open durumunda player aşağı kayıyor
```

Hedef mimari:
```text
BottomSheet content = scrollable content only
MiniPlayer = body portal + fixed bottom-0
ExpandedPlayer = body portal + fixed inset-0
```
