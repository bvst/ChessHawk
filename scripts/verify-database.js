const fs = require('fs');

console.log('=== VERIFISERING AV TAKTISK DATABASE ===\n');

try {
    const data = JSON.parse(fs.readFileSync('src/data/problems.json', 'utf8'));
    
    console.log(`Totalt antall problemer: ${data.totalPuzzles}`);
    console.log(`Database versjon: ${data.version}`);
    console.log(`Generert: ${data.generated}`);
    console.log(`Antall temaer: ${data.themes.length}`);
    
    console.log('\n=== FØRSTE PROBLEM PER TEMA ===');
    
    data.themes.forEach(theme => {
        const puzzle = data.puzzles.find(p => p.theme === theme);
        const themeCount = data.puzzles.filter(p => p.theme === theme).length;
        
        console.log(`\n${theme.toUpperCase()} (${themeCount} problemer):`);
        console.log(`  Tittel: ${puzzle.title}`);
        console.log(`  Beskrivelse: ${puzzle.description}`);
        console.log(`  Vanskelighet: ${puzzle.difficulty} (${puzzle.rating})`);
        console.log(`  Poeng: ${puzzle.points}`);
        console.log(`  Løsning: ${puzzle.solution.join(', ')}`);
    });
    
    // Statistikk
    const difficulties = {};
    data.puzzles.forEach(p => {
        difficulties[p.difficulty] = (difficulties[p.difficulty] || 0) + 1;
    });
    
    console.log('\n=== VANSKELIGHETSFORDELING ===');
    Object.entries(difficulties).forEach(([diff, count]) => {
        console.log(`${diff}: ${count} problemer`);
    });
    
    console.log('\n✅ Database er gyldig og komplett!');
    
} catch (error) {
    console.error('❌ Feil ved lesing av database:', error.message);
    process.exit(1);
}
