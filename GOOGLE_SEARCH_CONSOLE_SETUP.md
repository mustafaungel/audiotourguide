# Google Search Console Setup Guide

This guide will help you set up Google Search Console for your Audio Tour Guides website to monitor and optimize your SEO performance.

## 1. Initial Setup

### Add and Verify Your Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"**
3. Choose **"URL prefix"** method
4. Enter your domain: `https://guided-sound-ai.lovable.app`
5. Verify ownership using one of these methods:
   - **HTML file upload** (Recommended)
   - HTML tag in `<head>`
   - Google Analytics
   - Google Tag Manager

### Verification Code Location
If using HTML tag method, add the verification meta tag to `index.html`:
```html
<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
```

## 2. Submit Your Sitemap

### Dynamic Sitemap
Your site has a **dynamic sitemap** that automatically updates with new guides and countries.

**Sitemap URL:** `https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/generate-sitemap`

### How to Submit:
1. In Google Search Console, go to **Sitemaps** (left sidebar)
2. Enter the sitemap URL in the field
3. Click **Submit**

**Expected Result:** 
- Google will crawl your sitemap within 24-48 hours
- You'll see the number of discovered URLs
- Any errors will be displayed

### Alternative: Static Sitemap (Backup)
If the dynamic sitemap has issues, you can use:
`https://guided-sound-ai.lovable.app/sitemap.xml`

## 3. URL Inspection Tool

### Check Indexing Status
Use the URL Inspection tool to verify if your pages are indexed:

1. Enter a URL in the search bar at the top
2. Click **"Test Live URL"**
3. View indexing status and any issues

### Request Indexing
For new guides or pages:
1. Inspect the URL
2. Click **"Request Indexing"**
3. Google will prioritize crawling that page

### Important URLs to Check:
- Homepage: `https://guided-sound-ai.lovable.app/`
- Guides page: `https://guided-sound-ai.lovable.app/guides`
- Countries page: `https://guided-sound-ai.lovable.app/country`
- Sample guide: `https://guided-sound-ai.lovable.app/guide/[guide-slug]`

## 4. Core Web Vitals Monitoring

### Understanding Core Web Vitals
Google ranks pages based on user experience metrics:

- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **FID (First Input Delay)**: < 100ms (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)

### Where to Monitor:
1. Go to **Experience** → **Core Web Vitals** in GSC
2. View **Mobile** and **Desktop** reports separately
3. Fix URLs with "Poor" or "Needs Improvement" status

### Common Issues & Fixes:
- **Slow LCP:** Optimize images (already using WebP + lazy loading ✅)
- **High CLS:** Reserve space for images, use proper aspect ratios ✅
- **Poor FID:** Minimize JavaScript, use code splitting

## 5. Index Coverage Monitoring

### Check Index Status
1. Go to **Indexing** → **Pages**
2. Review **"Why pages aren't indexed"** section
3. Common issues:
   - **Duplicate content:** Fixed with canonical URLs ✅
   - **Crawl errors:** Check robots.txt
   - **Noindex tag:** Intentional for `?access=xxx` URLs ✅

### Expected Index Status:
✅ **Indexed:**
- Homepage
- Main pages (Guides, Countries, Featured)
- All published guide detail pages
- All country pages

🚫 **Not Indexed (Expected):**
- URLs with `?access=` parameter (noindex meta tag applied)
- Admin pages (`/admin`, `/admin-login`)
- Auth pages (`/auth`)

## 6. Performance Reports

### Monitor Click-Through Rate (CTR)
1. Go to **Performance** → **Search Results**
2. Enable metrics: **Clicks, Impressions, CTR, Position**
3. Filter by:
   - **Pages:** Which pages get most traffic?
   - **Queries:** What keywords bring users?
   - **Countries:** Geographic distribution

### Optimization Tips:
- **Low CTR:** Improve meta descriptions and titles
- **High impressions, low clicks:** Better title/description match
- **Position 11-20:** One step away from page 1 - optimize content

## 7. Mobile Usability

### Check Mobile-Friendliness
1. Go to **Experience** → **Mobile Usability**
2. Fix any reported issues:
   - Text too small
   - Clickable elements too close
   - Content wider than screen

**Your site already has:**
✅ Responsive design with Tailwind CSS
✅ Mobile-friendly touch targets (min 44x44px)
✅ Proper viewport meta tag

## 8. Schema Markup Validation

### Verify Rich Results
1. Go to **Enhancements** → **Breadcrumbs**
2. Check for errors in structured data
3. Use [Rich Results Test](https://search.google.com/test/rich-results)

**Active Schema Types:**
- BreadcrumbList ✅
- ItemList (guide listings) ✅
- WebSite + SearchAction ✅
- AggregateRating (guides) ✅

## 9. Security & Manual Actions

### Check for Issues
1. Go to **Security & Manual Actions**
2. Ensure no penalties or security issues
3. If issues appear, follow Google's resolution steps

## 10. Weekly Monitoring Checklist

### Every Week:
- [ ] Check **Index Coverage** for new errors
- [ ] Review **Performance** report for CTR trends
- [ ] Monitor **Core Web Vitals** scores
- [ ] Inspect 2-3 new guide URLs
- [ ] Check sitemap submission status

### Monthly Tasks:
- [ ] Review **Mobile Usability** issues
- [ ] Analyze top-performing pages
- [ ] Identify improvement opportunities
- [ ] Update meta descriptions for low-CTR pages

## 11. Common Issues & Solutions

### Issue: Guides Not Appearing in Search
**Solutions:**
1. Submit sitemap again
2. Use URL Inspection → Request Indexing
3. Check if guide has `is_published=true` and `is_approved=true`
4. Verify no accidental `noindex` tag

### Issue: Duplicate Content Warnings
**Solutions:**
- Already handled with canonical URLs ✅
- Access code URLs have `noindex` meta tag ✅
- Country pages use unique content per location ✅

### Issue: Poor Mobile Performance
**Solutions:**
- Enable Brotli/Gzip compression on hosting
- Use CDN for static assets
- Already using lazy loading for images ✅
- Already using optimized WebP images ✅

## 12. Additional Resources

- [Google Search Central](https://developers.google.com/search)
- [Search Console Help](https://support.google.com/webmasters)
- [Web.dev - SEO Best Practices](https://web.dev/lighthouse-seo/)
- [Core Web Vitals Guide](https://web.dev/vitals/)

---

## Quick Reference: Important URLs

- **Search Console:** https://search.google.com/search-console
- **Rich Results Test:** https://search.google.com/test/rich-results
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Sitemap:** https://dsaqlgxajdnwoqvtsrqd.supabase.co/functions/v1/generate-sitemap

---

**Pro Tip:** Bookmark this guide and check Google Search Console weekly to stay on top of your SEO performance! 🚀
