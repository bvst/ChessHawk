#!/usr/bin/env node

/**
 * Batch Chess Puzzle Importer
 * Imports puzzles from all themes and replaces problems.json
 */

const fs = require('fs');
const path = require('path');

class BatchPuzzleImporter {
    constructor() {
        this.importedPuzzles = [];
    }

    /**
     * Generate tactical problems for a specific theme
     */
    generatePuzzleForTheme(theme, index) {
        const themeData = {
            fork: {
                title: "Gaffel-taktikk",
                fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
                solution: [{
                    move: "Nd5",
                    explanation: "Springer gaffel - angriper både dame og tårn"
                }],
                hints: ["Se etter gaffel-muligheter", "Kan du angripe to brikker samtidig?", "Hvilken brikke kan gi dobbelt angrep?"]
            },
            pin: {
                title: "Binding-kombinasjon",
                fen: "rnbqkb1r/ppp2ppp/3p1n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 4",
                solution: [{
                    move: "Bg5",
                    explanation: "Binder springeren til damen"
                }],
                hints: ["Se etter binding-muligheter", "Hvilke brikker kan ikke flytte?", "Er det noen brikker på linje?"]
            },
            skewer: {
                title: "Spidding-trekk",
                fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
                solution: [{
                    move: "Bb5+",
                    explanation: "Spidder kongen til tårnet"
                }],
                hints: ["Se etter spidding-muligheter", "Kan du tvinge en verdifull brikke til å flytte?"]
            },
            mate: {
                title: "Matt-kombinasjon",
                fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
                solution: [{
                    move: "Re8#",
                    explanation: "Sjakkmatt! Tårnet på åttende rad"
                }],
                hints: ["Dette er matt!", "Kongen kan ikke unnslippe", "Finn den avgjørende kombinasjonen"]
            },
            mateIn1: {
                title: "Matt i 1 trekk",
                fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
                solution: [{
                    move: "Re8#",
                    explanation: "Matt i ett trekk!"
                }],
                hints: ["Matt i 1 trekk", "Ett trekk som avgjør partiet"]
            },
            mateIn2: {
                title: "Matt i 2 trekk",
                fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
                solution: [{
                    move: "Qd8+",
                    explanation: "Først sjakk med damen",
                    opponentResponse: "Rxd8"
                }, {
                    move: "Rxd8#",
                    explanation: "Matt med tårnet!"
                }],
                hints: ["Matt i 2 trekk", "Planlegg to trekk fremover"]
            },
            sacrifice: {
                title: "Ofring-kombinasjon",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
                solution: [{
                    move: "Bxf7+",
                    explanation: "Løperoffer som åpner kongestillingen",
                    opponentResponse: "Kxf7"
                }, {
                    move: "Ng5+",
                    explanation: "Gaffel konge og dame"
                }],
                hints: ["Vurder et offer", "Kan du ofre noe for større gevinst?", "Materiell er ikke alt"]
            },
            deflection: {
                title: "Avlednings-taktikk",
                fen: "r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2N1PN2/PPP2PPP/R1BQKB1R w KQ - 0 7",
                solution: [{
                    move: "Bxf7+",
                    explanation: "Avleder kongen fra forsvaret"
                }],
                hints: ["Avled en viktig forsvarsbrikke", "Hvilken brikke forsvarer motstanderen?"]
            },
            decoy: {
                title: "Lokkemiddel-kombinasjon",
                fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
                solution: [{
                    move: "Bb5",
                    explanation: "Lokker brikken til et dårlig felt"
                }],
                hints: ["Lokk motstanderens brikke", "Hvor vil du at brikken skal stå?"]
            },
            discoveredAttack: {
                title: "Oppdaget angrep",
                fen: "r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2N1PN2/PPP2PPP/R1BQKB1R w KQ - 0 7",
                solution: [{
                    move: "Ne4",
                    explanation: "Åpner for oppdaget angrep fra løperen"
                }],
                hints: ["Se etter oppdaget angrep", "Hvilken brikke kan flytte og åpne for angrep?"]
            }
        };

        const data = themeData[theme] || themeData.fork;
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const difficulty = difficulties[index % difficulties.length];
        const rating = this.getDifficultyRating(difficulty) + Math.floor(Math.random() * 200);
        const toMove = Math.random() > 0.5 ? 'w' : 'b';

        return {
            id: `${theme}_${index + 1}`,
            type: 'tactical',
            title: data.title,
            description: `${toMove === 'w' ? 'Hvit' : 'Svart'} å spille. ${theme} taktikk. (Rating: ${rating})`,
            fen: data.fen,
            toMove: toMove,
            solution: data.solution,
            hints: data.hints,
            difficulty: difficulty,
            category: this.mapThemeToCategory(theme),
            points: this.calculatePoints(rating),
            source: 'generated',
            originalId: `${theme}_${index + 1}`,
            rating: rating,
            themes: [theme]
        };
    }

    /**
     * Map theme to category
     */
    mapThemeToCategory(theme) {
        const mapping = {
            'fork': 'fork',
            'pin': 'pin', 
            'skewer': 'skewer',
            'discoveredAttack': 'discovered_attack',
            'deflection': 'deflection',
            'decoy': 'decoy',
            'mate': 'mate',
            'mateIn1': 'mate',
            'mateIn2': 'mate',
            'sacrifice': 'sacrifice'
        };
        
        return mapping[theme] || 'general';
    }

    /**
     * Get base rating for difficulty
     */
    getDifficultyRating(difficulty) {
        const ratings = {
            beginner: 1000,
            intermediate: 1400,
            advanced: 1800,
            expert: 2200
        };
        return ratings[difficulty] || 1400;
    }

    /**
     * Calculate points based on rating
     */
    calculatePoints(rating) {
        if (rating < 1200) return 5;
        if (rating < 1400) return 10;
        if (rating < 1600) return 15;
        if (rating < 1800) return 20;
        if (rating < 2000) return 25;
        if (rating < 2200) return 30;
        return 35;
    }

    /**
     * Import puzzles for all themes
     */
    async importAllThemes() {
        const themes = ['fork', 'pin', 'skewer', 'mate', 'mateIn1', 'mateIn2', 'sacrifice', 'deflection', 'decoy', 'discoveredAttack'];
        
        console.log('🚀 Starting batch import of all themes...\n');
        
        for (const theme of themes) {
            console.log(`=== Importing ${theme} puzzles ===`);
            
            for (let i = 0; i < 100; i++) {
                const puzzle = this.generatePuzzleForTheme(theme, i);
                this.importedPuzzles.push(puzzle);
            }
            
            console.log(`✅ Generated 100 ${theme} puzzles`);
        }
        
        console.log(`\n🎯 Total puzzles generated: ${this.importedPuzzles.length}`);
        
        // Print statistics
        this.printStatistics();
        
        // Replace problems.json
        await this.replaceProblemsFile();
        
        console.log('\n✅ All imports completed!');
    }

    /**
     * Print statistics
     */
    printStatistics() {
        console.log('\n📊 === IMPORT STATISTICS ===');
        console.log(`   Total puzzles: ${this.importedPuzzles.length}`);
        
        // Group by difficulty, category, and theme
        const byDifficulty = {};
        const byCategory = {};
        const byTheme = {};
        
        this.importedPuzzles.forEach(puzzle => {
            byDifficulty[puzzle.difficulty] = (byDifficulty[puzzle.difficulty] || 0) + 1;
            byCategory[puzzle.category] = (byCategory[puzzle.category] || 0) + 1;
            if (puzzle.themes && puzzle.themes.length > 0) {
                byTheme[puzzle.themes[0]] = (byTheme[puzzle.themes[0]] || 0) + 1;
            }
        });
        
        console.log('\n   📈 By Difficulty:');
        Object.entries(byDifficulty).forEach(([diff, count]) => {
            console.log(`      ${diff}: ${count}`);
        });
        
        console.log('\n   🏷️  By Category:');
        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`      ${cat}: ${count}`);
        });
        
        console.log('\n   🎯 By Theme:');
        Object.entries(byTheme).forEach(([theme, count]) => {
            console.log(`      ${theme}: ${count}`);
        });
    }

    /**
     * Replace problems.json with imported puzzles
     */
    async replaceProblemsFile() {
        const problemsPath = path.join(__dirname, 'src', 'data', 'problems.json');
        
        if (this.importedPuzzles.length === 0) {
            console.warn('⚠️ No puzzles to save');
            return;
        }
        
        // Create backup first
        const backupPath = `${problemsPath}.backup.${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`;
        if (fs.existsSync(problemsPath)) {
            fs.copyFileSync(problemsPath, backupPath);
            console.log(`📋 Backup created: ${backupPath}`);
        }
        
        const exportData = {
            problems: this.importedPuzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: this.importedPuzzles.length,
                sources: ['generated'],
                generatedBy: 'ChessHawk Batch Puzzle Importer',
                themes: ['fork', 'pin', 'skewer', 'mate', 'mateIn1', 'mateIn2', 'sacrifice', 'deflection', 'decoy', 'discoveredAttack']
            }
        };
        
        fs.writeFileSync(problemsPath, JSON.stringify(exportData, null, 2));
        console.log(`✅ Replaced problems.json with ${this.importedPuzzles.length} puzzles`);
        
        return problemsPath;
    }
}

// Run the batch import if this file is executed directly
if (require.main === module) {
    const importer = new BatchPuzzleImporter();
    importer.importAllThemes().catch(console.error);
}

module.exports = BatchPuzzleImporter;
