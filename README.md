# sportmakers.pl – one-pager

Statyczny HTML/CSS/JS według `design/V8.html` i `design/brief.md`.

## Struktura
- `index.html` – strona
- `assets/css/main.css` – wszystkie style (tokeny na górze pliku)
- `assets/js/main.js` – menu, animacje, suwak, oś czasu, formularz
- `assets/js/vendor/` – GSAP 3.12.5 + ScrollTrigger (lokalnie)
- `assets/fonts/` – Archivo (zmienna szerokość i grubość) i Inter, woff2, latin + latin-ext
- `assets/img/` – logo, przecięte O, zdjęcia (oryginały + WebP/AVIF 800/1400/2200), favicon, og-image
- `tools/build-images.py` – generuje WebP/AVIF; uruchom ponownie po podmianie zdjęć (`python3 tools/build-images.py`)

## Podgląd lokalny
`python3 -m http.server` w tym katalogu i otwórz http://localhost:8000 (fonty nie ładują się z `file://`).
