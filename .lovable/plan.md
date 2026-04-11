

## Guide Kartı Düzeltmesi: Kenar Hizalama ve Metin Taşması

### Sorunlar
1. **Connector bantları yanlış konumda** — `px-[calc(2rem+0.75rem)]` hesaplaması ear cup'ların gerçek konumuyla uyuşmuyor. Bantlar ear cup'ların dışında veya içinde kalıyor.
2. **Orta metadata alanı taşıyor** — `flex-1 min-w-0` olmasına rağmen, iki sabit genişlikli ear cup (88px) + gap + padding hesabında orta alan yeterince daralmıyor ve içerik taşıyor.

### Çözüm — `src/components/GuideCard.tsx`

**1. Connector bantlarını ear cup'larla hizala:**
Mevcut karmaşık `calc()` padding'i yerine, ear cup'ların gerçek konumuna göre hizalama yap. Ear cup'lar `px-1` (4px) padding ile başlıyor ve 88px genişliğinde. Connector'lar ear cup'ların dış kenarının ortasına denk gelmeli:
- Sol connector: `left` = `4px + 44px` = `48px` (ear cup'ın ortası)
- Sağ connector: aynı mesafe sağdan

Bunu `justify-between` + padding yerine `absolute` pozisyonlama ile yapmak daha doğru olacak.

```tsx
{/* Band connectors */}
<div className="relative h-5">
  <div className={`absolute left-[48px] sm:left-[56px] w-[3px] h-full ${connectorColor} rounded-full`} />
  <div className={`absolute right-[48px] sm:right-[56px] w-[3px] h-full ${connectorColor} rounded-full`} />
</div>
```

**2. Orta metadata taşmasını düzelt:**
`overflow-hidden` zaten var ama location metni `truncate` ile kesilmeli ve font boyutu küçültülmeli:
- Location span'ına `max-w-full` ekle
- Tüm orta alana `text-center` ile sınırlama koy

**3. Ana body gap'ini azalt:**
`gap-2` (8px) → `gap-1` (4px) yaparak ear cup'lar arasında daha fazla alan bırak metadata'ya.

### Değişecek dosya
- **`src/components/GuideCard.tsx`** — connector pozisyonlama, gap azaltma, metadata overflow düzeltmesi

