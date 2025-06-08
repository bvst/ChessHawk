# ChessHawk ♗

En webapplikasjon for sjakktrening som utfordrer spillere med både taktiske og strategiske problemer.

## Prosjektidé

ChessHawk er inspirert av en hauk som både kan se det store bildet (strategi) og stupe ned med presisjon for å fange et bytte (taktikk). Brukere får presentert sjakkproblemer uten å vite om det er en taktisk kombinasjon eller en stilling som krever strategisk tenkning.

## Teknologi

- **Frontend:** HTML5, CSS3, JavaScript
- **Sjakkbibliotek:** chess.js (logikk) + chessboard.js (visualisering)
- **Avhengigheter:** jQuery

## Prosjektstruktur

```
chess-hawk/
├── index.html              # Hovedside
├── README.md              # Dokumentasjon
└── src/                   # Kildekode
    ├── css/
    │   └── styles.css     # Hovedstiler
    ├── js/
    │   └── chesshawk.js   # Hovedlogikk
    ├── lib/               # JavaScript-biblioteker
    │   ├── jquery.min.js
    │   ├── chess.min.js
    │   ├── chessboard.min.js
    │   └── chessboard.min.css
    └── img/               # Bilder
        └── chesspieces/
            └── wikipedia/  # Sjakkbrikke-bilder
```

## Installasjon og Kjøring

1. **Klon/last ned prosjektet:**
   ```bash
   git clone [repository-url]
   cd chess-hawk
   ```

2. **Start lokal server:**
   ```bash
   # Med Python
   python -m http.server 8000
   
   # Med Node.js
   npx http-server -p 8000
   ```

3. **Åpne i nettleser:**
   Gå til `http://localhost:8000`

## Funksjoner (MVP)

- ✅ Interaktivt sjakkbrett med dra-og-slipp
- ✅ Validering av lovlige trekk
- ✅ Visuell fremheving av mulige trekk
- ✅ Spillstatus (tur, sjakk, sjakkmatt, remis)
- ✅ Responsivt design

## Fremtidige Funksjoner

- [ ] Backend med Flask/FastAPI
- [ ] Database med sjakkproblemer
- [ ] Stockfish-integrasjon for analyse
- [ ] Brukerkontoer og fremgang
- [ ] Kategorisering av problemer (taktikk vs. strategi)
- [ ] Poengssystem og statistikk

## Utvikling

Prosjektet er strukturert for enkel utvidelse:

- **CSS:** Alle stiler i `src/css/styles.css`
- **JavaScript:** Hovedlogikk i `src/js/chesshawk.js`
- **Biblioteker:** Lokale kopier i `src/lib/`
- **Bilder:** Organisert i `src/img/`

## Bidrag

Alle bidrag er velkomne! Se [CONTRIBUTING.md](CONTRIBUTING.md) for retningslinjer.

## Lisens

[MIT License](LICENSE)
