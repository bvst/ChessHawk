# Chess Hawk CSS Struktur

## Oversikt
For å følge Chess Hawk Brand Book og gjøre vedlikehold enklere, er CSS delt opp i flere moduler:

- **base.css**: Grunnleggende farger, typografi, layout, variabler, header, sections
- **chessboard.css**: Sjakkbrett, brikker, drag/drop, touch handling
- **ui.css**: Knapper, varsler, paneler, badges, feedback, solution display
- **responsive.css**: Media queries og mobiltilpasning
- **styles.css**: Hovedfil som importerer alle moduler

## Brand Book Implementation
Alle CSS-filer følger Chess Hawk Brand Book:
- **Farger**: #007bff (primary), #f5f5f5 (secondary), #ffc107 (accent)
- **Typografi**: Arial, Helvetica Neue, sans-serif
- **UI-elementer**: Avrundede hjørner, skygger, konsistent spacing
- **Sjakkbrett**: Klassiske farger (#f0d9b5 / #b58863)

## Importrekkefølge
Importer via `styles.css` som håndterer riktig rekkefølge:
```css
@import url('base.css');
@import url('chessboard.css');  
@import url('ui.css');
@import url('responsive.css');
```

## Vedlikehold
- Endre kun relevante moduler for spesifikke endringer
- Følg fargepalett og typografi fra brand book
- Bruk CSS custom properties (variabler) for konsistens
- Kommenter større endringer

## Eksempel på import i HTML
```html
<link rel="stylesheet" href="src/lib/chessboard.min.css">
<link rel="stylesheet" href="src/css/styles.css">
```

## Status
✅ Brand book implementert
✅ CSS modularisert 
✅ Responsive design
✅ Touch support
✅ Accessibility features
✅ Norwegian language support
