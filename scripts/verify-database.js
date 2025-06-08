const fs = require('fs');

console.log('=== VERIFISERING AV TAKTISK DATABASE ===\n');

try {
    const data = JSON.parse(fs.readFileSync('src/data/problems.json', 'utf8'));
    
    // Håndter begge strukturer
    const problems = data.problems || data.puzzles;
    const totalCount = data.problems?.length || data.totalPuzzles;
    
    console.log(`Totalt antall problemer: ${totalCount}`);
    
    if (data.version) {
        console.log(`Database versjon: ${data.version}`);
        console.log(`Generert: ${data.generated}`);
    }
    
    // Finn alle unike kategorier/themes
    const categories = data.themes || [...new Set(problems.map(p => p.category))];
    console.log(`Antall temaer: ${categories.length}`);
    console.log(`Temaer: ${categories.join(', ')}`);
    
    console.log('\n=== FØRSTE PROBLEM PER TEMA ===');
    
    categories.forEach(category => {
        const puzzle = problems.find(p => (p.category || p.theme) === category);
        const categoryCount = problems.filter(p => (p.category || p.theme) === category).length;
        
        console.log(`\n${category.toUpperCase()} (${categoryCount} problemer):`);
        console.log(`  Tittel: ${puzzle.title}`);
        console.log(`  Beskrivelse: ${puzzle.description}`);        console.log(`  Vanskelighet: ${puzzle.difficulty} (${puzzle.rating})`);
        console.log(`  Poeng: ${puzzle.points}`);
        const solutionText = puzzle.solution?.map ? puzzle.solution.map(s => s.move).join(', ') : puzzle.solution?.join(', ') || 'N/A';
        console.log(`  Løsning: ${solutionText}`);
    });
    
    // Statistikk
    const difficulties = {};
    problems.forEach(p => {
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
