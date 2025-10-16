# Mapa Atrakcji Turystycznych Wiednia

Interaktywna aplikacja Next.js wyświetlająca mapę Wiednia z zaznaczonymi atrakcjami turystycznymi. Każda atrakcja jest oznaczona markerem z informacyjnym popupem zawierającym nazwę, adres i współrzędne geograficzne.

## 🎯 Funkcje

- **Interaktywna mapa** - wykorzystuje react-leaflet do wyświetlania mapy OpenStreetMap
- **12 atrakcji turystycznych** - najważniejsze miejsca historyczne i turystyczne Wiednia
- **Markery z popupami** - każdy punkt zawiera szczegółowe informacje
- **Lista atrakcji** - responsywny sidebar z możliwością wyboru atrakcji
- **Responsive design** - dostosowuje się do urządzeń mobilnych i desktopowych

## 🗺️ Atrakcje na mapie

1. Pomnik feldmarszałka Schwarzenberga
2. Pałac Habsburgów (Hofburg)
3. Belvedere Palace
4. Muzeum Armii Austriackiej
5. Miejsce Bitwy pod Wiedniem (Kahlenberg)
6. Türkenschanzpark
7. Kolumna Trójcy Świętej
8. Budynek Parlamentu
9. Schlosspark Schönbrunn
10. Ratusz
11. Katedra św. Szczepana
12. Vienna Museum

## 🚀 Uruchomienie

### Wymagania
- Node.js 18.0 lub nowszy
- npm lub yarn

### Instalacja

```bash
# Sklonuj repozytorium
git clone <repository-url>
cd zz-map

# Zainstaluj zależności
npm install

# Uruchom aplikację w trybie deweloperskim
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

### Inne komendy

```bash
# Budowanie aplikacji
npm run build

# Uruchomienie wersji produkcyjnej
npm start

# Sprawdzenie kodu (lint)
npm run lint
```

## 🛠️ Technologie

- **Next.js 15** - framework React z App Router
- **TypeScript** - typowane programowanie
- **React Leaflet** - komponenty React dla Leaflet
- **Leaflet** - biblioteka do map interaktywnych
- **Tailwind CSS** - utility-first CSS framework
- **ESLint** - linting kodu

## 📁 Struktura projektu

```
├── app/                    # Next.js App Router
│   ├── globals.css         # Globalne style
│   ├── layout.tsx          # Layout aplikacji
│   └── page.tsx            # Strona główna
├── components/             # Komponenty React
│   ├── AttractionList.tsx  # Lista atrakcji
│   └── ViennaMap.tsx       # Komponent mapy
├── data/                   # Dane aplikacji
│   └── attractions.ts      # Dane atrakcji turystycznych
└── public/                 # Statyczne pliki
```

## 🎨 Funkcjonalność

### Mapa
- Automatyczne dopasowanie widoku do wszystkich atrakcji
- Markery z popupami zawierającymi szczegółowe informacje
- Wyróżnianie wybranej atrakcji większym markerem
- Responsive design dostosowujący się do rozmiaru ekranu

### Lista atrakcji
- Przewijalna lista wszystkich 12 atrakcji
- Interaktywne elementy - kliknięcie wybiera atrakcję na mapie
- Wizualne wyróżnienie aktualnie wybranej atrakcji
- Informacje o współrzędnych geograficznych każdej atrakcji

## 📱 Responsywność

Aplikacja jest w pełni responsywna:
- **Desktop** - mapa po prawej, lista po lewej (3:1)
- **Mobile** - mapa na górze, lista na dole

## 🔧 Konfiguracja

Aplikacja używa domyślnej konfiguracji Next.js z następującymi dodatkami:
- TypeScript dla bezpieczeństwa typów
- Tailwind CSS dla stylizacji
- ESLint dla jakości kodu
- Turbopack dla szybszego developmentu

## 📄 Licencja

Projekt stworzony do celów edukacyjnych i demonstracyjnych.

---

Stworzono z ❤️ przy użyciu Next.js i React Leaflet
