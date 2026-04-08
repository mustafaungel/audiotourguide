

## Plan: Standalone ve Bağlı Guide Deneyimini Birleştirme

### Mevcut Durum
- **Standalone** (bağlı guide yok): `NewSectionAudioPlayer` direkt render edilir — chapter listesi hemen görünür, accordion yok.
- **Bağlı** (linked guides var): Tüm guide'lar pill butonlarla accordion'da, hepsi kapalı başlar. Kullanıcı tıklamadan hiçbir içerik görmez.

### Sorun
İki farklı deneyim → tutarsız UX. Standalone'da chapter'lar hemen görünürken, bağlı guide'larda kullanıcı neye tıklayacağını bilemiyor.

### Çözüm
Bağlı guide modunda **ana guide varsayılan olarak açık başlasın**. Böylece:
- Kullanıcı sayfaya girdiğinde standalone ile aynı deneyimi yaşar (chapter listesi hemen görünür)
- Diğer bağlı guide'lar accordion pill olarak aşağıda kapalı durur
- Tıklama ile diğer guide'lara geçiş yapılır

### Teknik Değişiklik

**`src/components/MultiTabAudioPlayer.tsx`** — tek dosya değişikliği:

1. `selectedGuideId` başlangıç değerini `null` yerine `mainGuide.id` yap:
   ```tsx
   const [selectedGuideId, setSelectedGuideId] = useState<string | null>(mainGuide.id);
   ```

2. `onActiveTabChange` ilk render'da çağrılsın (parent'ın `activeGuideId` state'ini senkronize etmesi için):
   ```tsx
   useEffect(() => {
     onActiveTabChange?.('main');
   }, []);
   ```

Bu kadar. Ana guide açık başlayacak, standalone deneyimiyle birebir aynı görünecek. Diğer guide'lar accordion pill olarak aşağıda kalacak.

