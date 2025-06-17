# Chess Hawk Brand Book

## Innholdsfortegnelse
- [Visuell Identitet](#visuell-identitet)
- [Fargepalett](#fargepalett)
- [Typografi](#typografi)
- [Ikonografi](#ikonografi)
- [Logo](#logo)
- [UI/UX Prinsipper](#uiux-prinsipper)
- [Eksempel UI-elementer](#eksempel-ui-elementer)
- [Tone of Voice](#tone-of-voice)
- [Dokumentasjonsstil](#dokumentasjonsstil)
- [Branding i Kode og UI](#branding-i-kode-og-ui)
- [Chess-spesifikke Retningslinjer](#chess-spesifikke-retningslinjer)

---

## Visuell Identitet
Chess Hawk skal fremstå som moderne, vennlig og inspirerende for sjakkentusiaster på alle nivåer. Designet skal være tydelig, tilgjengelig og reflektere sjakkens eleganse og strategi.

## Fargepalett (Sjakkbrett-harmonisk)
- **Primær:** #8b5a3c (varm brun) – brukes for hovedknapper, lenker og fremheving
- **Sekundær:** #f5f3f0 (varm off-white) – bakgrunn, paneler, kort  
- **Accent:** #d4af7a (gylden brun) – poeng, advarsler, markeringer
- **Tekst:** #2c1810 (mørk brun), #5c4a3a (medium brun)
- **Brettfarger:**
  - Hvit rute: #f0d9b5
  - Svart rute: #b58863

**Designfilosofi:** Fargepaletten er nøye valgt for å harmonere med de klassiske sjakkbrett-fargene. I stedet for å konkurrere med brettets farger, støtter og forsterker branding-fargene det naturlige, varme utseendet til sjakkbrettet.

**Eksempel:**
```css
.button {
  background: #8b5a3c;
  color: #fff;
  border-radius: 4px;
}

.chess-board .white-square { background: #f0d9b5; }
.chess-board .black-square { background: #b58863; }
```
```

## Typografi
- **Font:** 'Arial', 'Helvetica Neue', sans-serif
- **Overskrifter:** Fet, større størrelse
- **Brødtekst:** 16px, normal vekt
- **Knapper:** Store bokstaver, fet
- **Sjakknotasjon:** Bruk monospace for trekk (f.eks. `e4`, `Sf3`)

**Eksempel:**
```css
.chess-move { font-family: 'Courier New', monospace; }
```

## Ikonografi
- Bruk rene, moderne sjakkbrikke-ikoner (SVG/PNG) fra `src/img/chesspieces/`
- Ikoner skal være konsistente i stil og størrelse
- Bruk tydelige symboler for handlinger (f.eks. "neste", "forrige", "vis løsning")
- Unngå visuell støy – la sjakkbrettet og brikkene være i fokus

## Logo
- Bruk Chess Hawk-logoen i topptekst og favicon (hvis tilgjengelig)
- Ikke strekk, roter eller forvrenge logoen
- Sørg for luft rundt logoen
- Logoen kan brukes på forsiden, i dokumentasjon og i appens header

## UI/UX Prinsipper
- Klart og enkelt først
- Mobil først, responsivt design
- Høy kontrast for tilgjengelighet
- Konsistente knapper og varsler
- God avstand og gruppering for lesbarhet
- Sjakkbrettet skal alltid være sentralt og tydelig
- Bruk farge for å markere trekk, tema og poeng

## Eksempel UI-elementer
- **Knapper:**
  - Bakgrunn: #007bff, tekst: hvit, border-radius: 4px
  - Hover: #0056b3
- **Varsel:**
  - Info: Blå bakgrunn, hvit tekst
  - Advarsel: Gull bakgrunn, mørk tekst
- **Kort/Panel:**
  - Hvit bakgrunn, subtil skygge, avrundede hjørner
- **Sjakkbrett:**
  - Bruk klassiske sjakkfarger (#f0d9b5 / #b58863)
  - Brikker fra `src/img/chesspieces/`

**Eksempel:**
```html
<button class="button">NESTE PROBLEM</button>
<div class="alert alert-info">Løsning tilgjengelig!</div>
<div class="chess-board"></div>
```

## Tone of Voice
- Vennlig, oppmuntrende og sjakkentusiastisk
- All tekst på norsk (bokmål)
- Klart, konsist og positivt språk
- Unngå unødvendig sjargong (med mindre det er sjakkspesifikt)
- Eksempler:
  - "Bra jobbet! Du fant løsningen."
  - "Velg tema:"
  - "Neste problem"

## Dokumentasjonsstil
- All dokumentasjon på norsk
- Bruk tydelige overskrifter, punktlister og kodeblokker
- Inkluder skjermbilder eller diagrammer der det er nyttig
- Følg Markdown-standarden i `.github/instructions/markdown.instructions.md`

## Branding i Kode og UI
- Bruk norske variabelnavn og kommentarer der det er naturlig
- All UI-tekst og feilmeldinger på norsk
- Eksempel:
```javascript
// Norsk variabelnavn og kommentar
const hovedFarge = '#007bff'; // Primærfarge for Chess Hawk
visMelding('Velkommen til Chess Hawk!');
```
- Bruk fargepalett og typografi i all CSS og HTML

## Chess-spesifikke Retningslinjer
- Bruk offisielle sjakktermer på norsk:
  - Gaffel, binding, spett, matt, offer, avledning, lokking, oppdekningsangrep
- Bruk Unicode-symboler for brikker der det passer (♔ ♕ ♖ ♗ ♘ ♙)
- Notasjon og løsninger skal være tydelig formatert (f.eks. `1. e4 e5 2. Sf3`)
- Temaer og vanskelighetsgrad skal alltid vises tydelig
- Bruk farge eller ikon for å markere tema (f.eks. gaffel = gaffel-ikon eller blå markering)
- Sørg for at sjakkbrettet alltid er sentralt i layouten

## Eksempel på Branding i Appen
```html
<header>
  <img src="../src/img/chesshawk-logo.png" alt="Chess Hawk logo" height="48">
  <h1>Chess Hawk – Taktiske sjakkoppgaver</h1>
</header>
<main>
  <div class="chess-board"></div>
  <button class="button">NESTE PROBLEM</button>
</main>
```

---

> For spørsmål om branding, kontakt prosjektansvarlig eller se flere eksempler i kildekoden og designfiler.
