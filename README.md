# Alacak Defteri

Kime, ne kadar borç verdiğini ve hangi faiz oranıyla (%2.5 / %3) takip etmeni sağlayan basit bir PWA (Progressive Web App).

## Özellikler

- Kişi adı, borç tutarı ve faiz oranı girişi
- Faiz tutarı ve toplam borcun otomatik hesaplanması
- Notlar tarayıcı hafızasında (localStorage) cihazda saklanır
- JSON olarak dışa/içe aktarma (yedekleme, cihazlar arası taşıma)
- Offline çalışabilir (service worker ile)
- Android/iOS'ta "Ana ekrana ekle" ile uygulama gibi kullanılabilir

## Kullanım

Bu proje herhangi bir build adımı gerektirmez, saf HTML/CSS/JS'dir.

### Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

sonra tarayıcıdan `http://localhost:8000` adresini aç.

### Yayınlama

GitHub Pages, Vercel, Netlify gibi herhangi bir statik hosting servisi ile yayınlanabilir. Yayınladıktan sonra telefondan siteyi açıp "Ana ekrana ekle" seçeneğiyle native uygulama gibi kurulabilir.

## Dosya yapısı

- `index.html` — sayfa yapısı ve stiller
- `app.js` — uygulama mantığı
- `manifest.json` — PWA manifestosu
- `sw.js` — offline destek için service worker
- `icons/` — uygulama ikonları

## Not

Bu proje diğer projelerden (Whooy, FitPet, Düşünseli Kitap Kulübü vb.) bağımsız, ayrı bir depoda tutulmaktadır.
