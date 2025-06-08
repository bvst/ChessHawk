---
applyTo: '**/*.md'
---

# Chess Hawk Markdown Documentation Standards

## File Organization
- **Main README**: `README.md` - project overview and quick start
- **Documentation**: `docs/` - detailed documentation and reports
- **Directory READMEs**: Each major directory should have README.md

## Markdown Standards
- Use consistent heading structure
- Include table of contents for long documents
- Use proper code block syntax highlighting
- Maintain consistent formatting throughout

## Document Structure
```markdown
# Main Title

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## Overview
Brief description of the document purpose.

## Section Headings
Use ## for major sections, ### for subsections.
```

## Code Blocks
Use syntax highlighting for all code:
```markdown
```javascript
// JavaScript code
const game = new Chess();
```

```css
/* CSS code */
.chess-board {
    max-width: 400px;
}
```

```bash
# Terminal commands
node scripts/verify-database.js
```
```

## Norwegian Documentation
All user-facing documentation should be in Norwegian:
```markdown
# Chess Hawk - Taktiske Sjakk-oppgaver

## Oversikt
Chess Hawk er en applikasjon for å løse taktiske sjakk-problemer.

## Installasjon
1. Last ned prosjektet
2. Åpne `index.html` i nettleseren
3. Begynn å løse problemer!
```

## Documentation Categories

### README Files
- **Purpose**: Quick overview and navigation
- **Audience**: Developers and users
- **Content**: Installation, usage, key features

### Technical Documentation
- **Purpose**: Detailed implementation details
- **Audience**: Developers
- **Content**: Architecture, API, database schema

### User Guides
- **Purpose**: How to use the application
- **Audience**: End users
- **Content**: Features, tips, troubleshooting

## Formatting Standards
```markdown
## Formatting Examples

### Lists
- Unordered lists with hyphens
- Keep consistent indentation
- Use sub-bullets when needed

### Numbered Lists
1. First item
2. Second item
3. Third item

### Emphasis
- **Bold** for important terms
- *Italic* for emphasis
- `Code` for technical terms

### Links
- [Internal link](./docs/IMPLEMENTATION.md)
- [External link](https://github.com/chess-hawk)

### Tables
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

## Status Badges
Use status indicators in documentation:
```markdown
## Project Status
- ✅ Database: 1000 problems loaded
- ✅ Testing: All tests passing  
- ✅ Mobile: Responsive design complete
- 🔄 Features: In development
- ❌ Issue: Known problem
```

## File Naming
- Use lowercase with hyphens: `implementation-status.md`
- Be descriptive: `database-management-guide.md`
- Include version if needed: `api-v2-documentation.md`

## Cross-References
Link related documents:
```markdown
## Related Documentation
- [Database Schema](./database-schema.md)
- [Testing Guide](../tests/README.md)
- [Deployment Instructions](./deployment.md)
```

## Change Log Format
```markdown
## Changelog

### [Version 2.0] - 2025-06-08
#### Added
- 1000 tactical problems across 10 themes
- Norwegian localization
- Mobile responsive design

#### Changed
- Improved database structure
- Updated UI components

#### Fixed
- Path resolution in test files
- Mobile layout issues
```

## Images and Assets
```markdown
## Screenshots
![Chess Hawk Interface](../src/img/screenshot.png)

*Figure 1: Main application interface showing tactical problem*
```

## Technical Specifications
Use consistent formatting for technical details:
```markdown
## System Requirements
- **Browser**: Modern browsers with ES6 support
- **Resolution**: Minimum 320px width
- **JavaScript**: Required for full functionality
- **Storage**: ~1MB for application files
```
