# GitHub Instructions for Chess Hawk

This directory contains specialized instruction files for GitHub Copilot and other AI tools working on the Chess Hawk project.

## Instruction Files

### Core Instructions
- **`coding.instructions.md`** - JavaScript and CSS coding standards
- **`structure.instructions.md`** - Project organization and file structure
- **`database.instructions.md`** - Database schema and management rules

### Workflow Instructions  
- **`git.instructions.md`** - Git workflow and commit standards
- **`testing.instructions.md`** - Testing procedures and requirements
- **`localization.instructions.md`** - Norwegian language requirements

## How These Work

Each `.instructions.md` file uses YAML frontmatter with `applyTo: '**'` to ensure the instructions apply to all files in the project. This helps AI tools understand:

- Project-specific coding standards
- Database requirements and constraints
- File organization rules
- Testing procedures
- Language and localization requirements

## Usage

These instruction files are automatically detected by GitHub Copilot and other AI tools when working in this repository. They provide context-aware assistance that follows the specific patterns and requirements of the Chess Hawk project.

## Maintenance

Keep these instructions up-to-date when:
- Project structure changes
- New coding standards are adopted
- Database schema evolves
- Testing procedures are updated
- Language requirements change

The instructions should reflect the current state of the project and guide AI tools to make appropriate suggestions and modifications.
