#!/usr/bin/env node

/**
 * Simple Chess Puzzle Importer Test
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting simple puzzle import test...');

// Generate 10 puzzles for testing
const puzzles = [];
const themes = ['fork', 'pin', 'skewer', 'mate', 'sacrifice'];

for (let i = 0; i < 10; i++) {
    const theme = themes[i % themes.length];
    const puzzle = {
        id: `test_${theme}_${i + 1}`,
        type: 'tactical',
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)}-taktikk`,
        description: `Hvit å spille. ${theme} taktikk.`,
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
        toMove: "w",
        solution: [{
            move: "Nd5",
            explanation: `${theme} kombinasjon`
        }],
        hints: [`Se etter ${theme}-muligheter`],
        difficulty: "intermediate",
        category: theme,
        points: 15,
        source: 'test',
        themes: [theme]
    };
    puzzles.push(puzzle);
}

console.log(`✅ Generated ${puzzles.length} test puzzles`);

// Create the export data
const exportData = {
    problems: puzzles,
    metadata: {
        exportDate: new Date().toISOString(),
        totalProblems: puzzles.length,
        sources: ['test'],
        generatedBy: 'ChessHawk Simple Test Importer'
    }
};

// Save to problems.json
const problemsPath = path.join(__dirname, 'src', 'data', 'problems.json');

// Create backup
const backupPath = `${problemsPath}.backup.${Date.now()}`;
if (fs.existsSync(problemsPath)) {
    fs.copyFileSync(problemsPath, backupPath);
    console.log(`📋 Backup created: ${backupPath}`);
}

// Write new file
fs.writeFileSync(problemsPath, JSON.stringify(exportData, null, 2));
console.log(`✅ Replaced problems.json with ${puzzles.length} puzzles`);

console.log(`📄 File written to: ${problemsPath}`);
console.log(`📊 File size: ${fs.statSync(problemsPath).size} bytes`);

console.log('\n🎯 Test completed successfully!');
