

## "Load More" Butonu — Audio Guide Temasına Uygun Tasarım

### Mevcut Durum

Şu anda her iki sayfada da (`Index.tsx`, `Guides.tsx`) Load More butonu düz bir `variant="outline"` Button — generic, audio guide temasıyla uyumsuz.

### Yapılacak

Her iki sayfadaki Load More butonunu, uygulamanın audio guide kimliğine uygun şekilde yeniden tasarla:

- Kulaklık ikonu (`Headphones`) ekle
- Ses dalgası animasyonlu dekorasyon (mevcut `audio-wave-bar` class'ları)
- Amber/altın tonlu gradient border (`border-amber-500/20`) — premium hisse uyumlu
- Kalan rehber sayısını badge olarak göster (`Badge` component)
- Metin: "Discover More Audio Guides" tarzı, tema ile uyumlu
- `active:scale-95` dokunma geri bildirimi

### Teknik Özet

```
2 dosya:

src/pages/Index.tsx (satır 293-299)
  - Button → özel div/button: Headphones ikonu + "Discover More Guides" + Badge(remaining)
  - border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10
  - Küçük audio-wave-bar animasyonu buton içinde

src/pages/Guides.tsx (satır 294-303)
  - Aynı tasarım
```

Her iki dosyada da aynı Load More bloku kullanılacak — tutarlılık sağlanacak.

