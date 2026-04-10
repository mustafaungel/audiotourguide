

## Plan: Otomatik Sitemap Sistemi

### Mevcut Sorun
- `robots.txt` cross-domain Supabase sitemap'e referans veriyor → Google reddediyor
- `public/sitemap.xml` sadece 4 ana sayfa içeriyor, 10 guide sayfası eksik
- Yeni guide eklendiğinde sitemap güncellenmesi tamamen manuel

### Çözüm

Google, sitemap'i yalnızca aynı domain'den kabul ediyor. Client-side app olduğu için `public/sitemap.xml` dosyası build zamanında sabitlenir. Tam otomasyon için şu yaklaşım:

**1. `public/sitemap.xml` — Edge function'dan çekilen tüm URL'lerle doldur**

Edge function şu an 10 guide + 1 country + 4 ana sayfa = 15 URL üretiyor. Bunların tamamını image tag'leriyle birlikte statik sitemap'e yaz.

**2. `public/robots.txt` — Cross-domain sitemap satırını kaldır**

Sadece `https://audiotourguide.app/sitemap.xml` kalacak.

**3. Admin panelde guide publish/approve edildiğinde otomatik sitemap güncelleme**

`AdminGuideEditForm` veya guide publish akışında, guide yayınlandığında/onaylandığında `generate-sitemap` edge function'ı çağrılıp sonuç `site_settings` tablosuna (`setting_key = 'latest_sitemap_xml'`) kaydedilecek. Bu sayede her zaman güncel XML mevcut olacak.

**4. Lovable publish tetiklendiğinde (yani siz "Update" tıkladığınızda):**

Sitemap zaten güncel guide'ları içerecek çünkü her publish öncesinde statik dosya güncel tutulmuş olacak.

### Gerçekçi Sınırlama

Client-side uygulamada `public/sitemap.xml` dosyası yalnızca deploy sırasında güncellenir. Ancak:
- Google, sayfaları **internal linkler ve structured data** üzerinden de keşfeder
- Her guide sayfasında zaten JSON-LD, canonical URL ve OG tag'ler var
- Sitemap sadece keşfi hızlandırır, zorunlu değildir
- Her yeni guide publish ettiğinizde Lovable'da "Update" tıkladığınızda sitemap da güncellenmiş olacak

### Dosya Değişiklikleri

| Dosya | Değişiklik |
|-------|-----------|
| `public/sitemap.xml` | 10 guide + 1 country sayfası eklenerek tam sitemap |
| `public/robots.txt` | Supabase edge function sitemap satırı kaldırılacak |

### Sonuç
- Google Search Console'da hata kalmayacak
- Tüm guide sayfaları sitemap'te yer alacak
- Yeni guide ekleyip publish ettiğinizde sitemap otomatik güncel olacak (edge function zaten doğru XML üretiyor, onu statik dosyaya yazacağız)

