---
applyTo: '**/*.json'
---

# Chess Hawk JSON Data Standards

## File Organization
- **Main Database**: `src/data/problems.json` - 1000 tactical problems
- **Configuration**: Various JSON config files as needed

## Database Schema (problems.json)
```json
{
  "version": "2.0",
  "generated": "2025-06-08T18:39:44.750Z",
  "totalPuzzles": 1000,
  "themes": [
    "fork", "pin", "skewer", "mate", "mateIn1", 
    "mateIn2", "sacrifice", "deflection", "decoy", 
    "discoveredAttack"
  ],
  "problems": [
    {
      "id": "fork_001",
      "title": "Gaffel-taktikk 1",
      "description": "Angrip to brikker samtidig",
      "category": "fork",
      "difficulty": "beginner",
      "rating": 1000,
      "points": 5,
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "solution": ["Nf3", "Nc6", "Ng5"]
    }
  ]
}
```

## Required Fields
Every problem must include:
- **id**: Unique identifier (theme_number format)
- **title**: Norwegian title
- **description**: Norwegian description
- **category**: One of the 10 themes
- **difficulty**: "beginner", "intermediate", or "advanced"
- **rating**: Number between 1000-2000
- **points**: Number between 5-15
- **fen**: Valid FEN position string
- **solution**: Array of moves in algebraic notation

## Validation Rules
- **Total problems**: Exactly 1000
- **Theme distribution**: Exactly 100 problems per theme
- **Difficulty distribution**: ~340 beginner, ~330 intermediate, ~330 advanced
- **Encoding**: UTF-8 for Norwegian characters
- **FEN validation**: All positions must be valid chess positions
- **Move validation**: All solution moves must be legal

## Norwegian Text Requirements
```json
{
  "title": "Matt i to trekk 1",
  "description": "Finn matt i to trekk",
  "themes": [
    "gaffel", "binding", "spett", "matt", 
    "mattI1", "mattI2", "offer", "avledning", 
    "lokking", "oppdekningsangrep"
  ]
}
```

## Data Integrity
- Use consistent ID format: `{theme}_{number:03d}`
- Ensure proper JSON formatting (no trailing commas)
- Validate all FEN strings
- Check solution move sequences
- Verify difficulty ratings align with assigned levels

## Performance Considerations
- Keep file size manageable (current ~570KB is acceptable)
- Structure for efficient parsing
- Minimize nested complexity
- Use consistent field ordering

## Backup and Versioning
- Never edit directly - use generation scripts
- Always verify with `node scripts/verify-database.js`
- Maintain version numbering in schema
- Include generation timestamp

## Example Theme Sections
```json
{
  "problems": [
    {
      "id": "fork_001",
      "title": "Gaffel-taktikk 1",
      "category": "fork",
      "difficulty": "beginner",
      "rating": 1000
    },
    {
      "id": "pin_001", 
      "title": "Binding-kombinasjon 1",
      "category": "pin",
      "difficulty": "beginner",
      "rating": 1050
    }
  ]
}
```

## Error Prevention
- Validate JSON syntax before saving
- Check for duplicate IDs
- Verify theme counts
- Ensure all required fields present
- Test loading in application before commit
