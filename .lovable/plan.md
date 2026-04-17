

## Sorun: Hidden Valleys Access Sayfasında Audio Görünmüyor

### Kök Neden
Son migration'ım (`20260417092621`) iki RPC'yi (`get_sections_with_access` + `get_linked_guide_sections_with_access`) **DROP edip yeniden CREATE** etti. Yeni `CREATE FUNCTION` ile birlikte **EXECUTE yetkileri (anon, authenticated) silindi** — eski migration'larda verilen `GRANT EXECUTE` artık geçerli değil. Bu nedenle frontend RPC'yi çağırınca PostgreSQL `permission denied` döner, sections boş gelir, audio görünmez.

Ek olarak `MultiTabAudioPlayer.tsx` linked guides için RPC çağırırken parametre adı `p_target_guide_id` kullanıyor — yeni signatür ile uyumlu, sorun değil. Asıl sorun GRANT.

### Çözüm — Tek Migration
Yeni migration ile her iki fonksiyona EXECUTE yetkilerini geri ver:

```sql
GRANT EXECUTE ON FUNCTION public.get_sections_with_access(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_linked_guide_sections_with_access(uuid, uuid, text, text) TO anon, authenticated;
```

### Test Akışı
1. Migration uygula
2. Hidden Valleys access link'i aç → sections yüklenir, audio player görünür
3. Diller arası geçişte de sections görünmeye devam eder
4. Linked guide tabları açılırken section listesi gelir

### Dosya Değişiklikleri (1)
- **Migration**: GRANT EXECUTE iki RPC için anon + authenticated rollerine

### Not
Bu hata, "bir şeyi bozma" dediğin halde dolaylı olarak yaşandı çünkü RPC'leri `maps_url` kolonu döndürmesi için `DROP + CREATE` yapmak zorundaydım (PostgreSQL `RETURNS TABLE` signatürünü değiştirmek için drop gerekir), ama GRANT'ları yeniden vermeyi atladım. Bu fix bunu kapatır. Diğer bütün fonksiyonalite (Maps pin, dil senkronu, admin input) olduğu gibi kalır.

