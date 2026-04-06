

## Plan: Dark/Light Mod Renk Uyumsuzlukları — Tam Sistem Analizi ve Düzeltme

### Problem Özeti

Ekran görüntüsünde admin panelindeki Collapsible butonlar (QR Code Management, Contact Management vb.) hover durumunda neredeyse ayırt edilemiyor. Ayrıca sistemde birçok yerde hardcoded renkler (`bg-white`, `bg-gray-*`, `bg-blue-100`, `bg-green-50`, `text-gray-600` vb.) dark mode'da kırılıyor.

### Tespit Edilen Sorunlar

#### 1. Admin Panel — Collapsible buton hover görünmezliği
**`AdminDashboard.tsx` satır 149**: `hover:bg-muted/50` çok düşük kontrast → hem light hem dark'ta imleç üzerindeyken fark edilmiyor.

#### 2. GuideCard — Hardcoded `bg-white` dark mode'da kırılıyor
**`GuideCard.tsx` satır 139, 150**: Bookmark/Share butonları `bg-white/80 hover:bg-white` → dark mode'da parlak beyaz kare olarak görünüyor.
**`GuideCard.tsx` satır 96-112**: Kategori/difficulty badge'leri (`bg-blue-100 text-blue-800`, `bg-green-100 text-green-800` vb.) → dark mode'da okunaksız.

#### 3. Admin bileşenleri — Hardcoded renkler
- **`AdminEmailTesting.tsx`**: `bg-green-50 border-green-200 text-green-800` / `bg-red-50 border-red-200 text-red-800` → dark mode karşılığı yok
- **`AdminEmailResend.tsx`**: `bg-green-50` / `bg-red-50`, `text-gray-600` → dark mode karşılığı yok
- **`AdminQRCodeRegenerator.tsx`**: `bg-blue-600 text-white` → sistem dışı hardcoded
- **`GuideCreationForm.tsx`**: `text-gray-500` → dark mode'da okunaksız

#### 4. AudioAccess sayfası
- **`AudioAccess.tsx` satır 615-621**: `bg-gray-50 dark:bg-gray-900`, `text-gray-700 dark:text-gray-300` → dark variant var ama tailwind semantic renk sistemi kullanılmıyor

#### 5. GuideDetail sayfası
- **satır 927**: `bg-white` QR code container → dark mode'da parlak kare
- **satır 949**: `bg-white dark:bg-gray-800` → kısmen düzeltilmiş ama gray-800 sistem dışı

#### 6. AdminPanel
- **satır 503**: `bg-white` input → dark mode'da kırılıyor

#### 7. PaymentFlowTestPanel & StripeDebugPanel
- `bg-white/60` → dark mode'da görünmez veya çirkin

### Çözüm

Her dosyada hardcoded renkleri Tailwind CSS değişken tabanlı semantic renklerle değiştir:

| Hardcoded | Semantic Karşılık |
|-----------|-------------------|
| `bg-white` | `bg-card` veya `bg-background` |
| `bg-white/80` | `bg-card/80` |
| `bg-white/60` | `bg-card/60` |
| `bg-gray-50` | `bg-muted/50` |
| `bg-gray-900` | `bg-muted` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-green-50 text-green-800` | `bg-success/10 text-success dark:bg-success/20 dark:text-success` |
| `bg-red-50 text-red-800` | `bg-destructive/10 text-destructive dark:bg-destructive/20` |
| `bg-blue-100 text-blue-800` | `bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent` |

#### Admin Collapsible hover düzeltmesi
`AdminDashboard.tsx` satır 149: `hover:bg-muted/50` → `hover:bg-muted` (daha belirgin hover state)

#### GuideCard badge'leri dark mode uyumlu
Kategori ve difficulty fonksiyonlarına `dark:` varyantları ekle:
```
cultural: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
historical: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
...
```

### Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `src/components/AdminDashboard.tsx` | Collapsible hover: `hover:bg-muted` |
| `src/components/GuideCard.tsx` | `bg-white/80` → `bg-card/80`, badge dark variants |
| `src/components/AdminEmailTesting.tsx` | Success/error renklerine dark variants ekle |
| `src/components/AdminEmailResend.tsx` | `bg-green-50` → semantic + dark variant |
| `src/components/AdminQRCodeRegenerator.tsx` | `bg-blue-600 text-white` → `bg-primary text-primary-foreground` |
| `src/components/GuideCreationForm.tsx` | `text-gray-500` → `text-muted-foreground` |
| `src/pages/AudioAccess.tsx` | `bg-gray-50` → `bg-muted/50`, `text-gray-*` → semantic |
| `src/pages/GuideDetail.tsx` | `bg-white` → `bg-card`, gray-800 → semantic |
| `src/pages/AdminPanel.tsx` | `bg-white` input → `bg-card` |
| `src/components/PaymentFlowTestPanel.tsx` | `bg-white/60` → `bg-card/60` |
| `src/components/StripeDebugPanel.tsx` | `bg-white/60` → `bg-card/60` |
| `src/components/StripeTestHelper.tsx` | `bg-white/60` → `bg-card/60` |
| `src/components/EmailSystemTest.tsx` | Success/error dark variants |
| `src/components/RegionalAccessError.tsx` | Zaten dark variant var, kontrol amaçlı |

### Etki
- Tüm bileşenler dark/light modda tutarlı görünecek
- Admin panelinde hover state'ler belirgin olacak
- Hardcoded beyaz/gri renkler kaldırılacak → tema değişikliklerinde otomatik uyum

