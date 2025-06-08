---
applyTo: '**'
---

# Chess Hawk Localization Instructions

## Language Requirements
**Primary Language**: Norwegian (Bokmål)
All user-facing text must be in Norwegian, including:

- Problem titles and descriptions
- User interface elements
- Error messages
- Instructions and help text
- Comments in code (where appropriate)

## Norwegian Text Standards
- Use proper Norwegian grammar and spelling
- Employ chess-specific terminology in Norwegian
- Maintain consistent terminology throughout application
- Ensure proper encoding (UTF-8) for Norwegian characters (æ, ø, å)

## Chess Terminology in Norwegian
- **Sjakk** = Chess
- **Matt** = Checkmate
- **Sjakkmatt** = Checkmate
- **Gaffel** = Fork
- **Binding** = Pin
- **Spett** = Skewer
- **Offer** = Sacrifice
- **Avledning** = Deflection
- **Lokking** = Decoy
- **Oppdekningsangrep** = Discovered Attack
- **Taktikk** = Tactics
- **Kombinasjon** = Combination

## Difficulty Levels in Norwegian
- **beginner** = "nybegynner" (in UI, keep "beginner" in data)
- **intermediate** = "mellomnivå" (in UI, keep "intermediate" in data)
- **advanced** = "avansert" (in UI, keep "advanced" in data)

## User Interface Text Examples
```javascript
// Norwegian UI text
const norwegianText = {
    loading: "Laster inn problemer...",
    selectTheme: "Velg tema:",
    difficulty: "Vanskelighetsgrad:",
    points: "Poeng:",
    solution: "Løsning:",
    nextProblem: "Neste problem",
    previousProblem: "Forrige problem",
    showSolution: "Vis løsning",
    hideSolution: "Skjul løsning"
};
```

## Content Guidelines
- Keep descriptions concise but informative
- Use active voice when possible
- Maintain consistent formatting
- Ensure all chess positions are accurately described
- Provide clear solution explanations

## Encoding Requirements
- All files must be saved with UTF-8 encoding
- Verify Norwegian characters display correctly
- Test on different browsers and devices
- Ensure database JSON is properly encoded

## Translation Consistency
When adding new content:
1. Use existing terminology patterns
2. Maintain the same style and tone
3. Verify translations with native speakers if possible
4. Keep technical terms consistent across the application
