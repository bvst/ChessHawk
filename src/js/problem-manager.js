/**
 * ChessHawk - Problem Manager
 * 
 * Håndterer problemlasting, tilfeldig valg og problemvisning
 */

/**
 * Last problemer fra JSON-fil
 */
async function loadProblems() {
    console.log('📂 === LOADING PROBLEMS ===');
    
    try {
        console.log('   🔍 Attempting to fetch problems.json...');
        
        // Prøv først hovedstien
        let jsonPath = 'src/data/problems.json';
        console.log(`   📂 Trying primary path: ${jsonPath}`);
        let response = await fetch(jsonPath);
        
        // Hvis det feiler, prøv alternativ sti
        if (!response.ok) {
            jsonPath = '../src/data/problems.json';
            console.log(`   📂 Trying alternative path: ${jsonPath}`);
            response = await fetch(jsonPath);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(`   ✅ Fetch successful (status: ${response.status})`);
        
        const data = await response.json();
        
        // Valider datastruktur
        if (!data) {
            throw new Error('No data received from problems.json');
        }
        
        if (!data.puzzles || !Array.isArray(data.puzzles)) {
            throw new Error('Invalid data structure: puzzles array not found or not an array');
        }
        
        problems = data.puzzles;
        
        console.log(`   📊 === PROBLEMS LOADED ===`);
        console.log(`      📏 Total problems: ${problems.length}`);
        
        // Analyser lastede problemer
        const problemsByType = {};
        const problemsByDifficulty = {};
        
        problems.forEach((problem, index) => {
            console.log(`      ${index + 1}. ${problem.id} (${problem.type}/${problem.difficulty}) - ${problem.title}`);
            
            // Tell etter type
            problemsByType[problem.type] = (problemsByType[problem.type] || 0) + 1;
            
            // Tell etter vanskelighetsgrad
            problemsByDifficulty[problem.difficulty] = (problemsByDifficulty[problem.difficulty] || 0) + 1;
            
            // Valider problemstruktur
            if (!problem.solution || problem.solution.length === 0) {
                console.error(`      ❌ ERROR - Problem ${problem.id} has no solution!`);
            }
            
            if (!problem.fen) {
                console.error(`      ❌ ERROR - Problem ${problem.id} has no FEN!`);
            }
        });
        
        console.log(`   📊 Problems by type:`, problemsByType);
        console.log(`   📊 Problems by difficulty:`, problemsByDifficulty);
        
        console.log('📂 === PROBLEMS LOADING COMPLETE ===');
        
        // Last et tilfeldig problem ved oppstart
        loadRandomProblem();
        
    } catch (error) {
        console.error('❌ === ERROR LOADING PROBLEMS ===');
        console.error('   💥 Error details:', error);
        console.error('   📚 Error stack:', error.stack);
        showFeedback('Feil ved lasting av problemer. Prøv igjen senere.', 'error');
    }
}

/**
 * Last et tilfeldig problem fra problemlisten
 */
function loadRandomProblem() {
    console.log('🔄 loadRandomProblem() - START');
    
    if (!problems || problems.length === 0) {
        console.error('❌ No problems loaded yet!');
        showFeedback('Ingen problemer lastet ennå. Vent litt...', 'error');
        return;
    }
    
    // Velg et tilfeldig problem
    const randomIndex = Math.floor(Math.random() * problems.length);
    currentProblem = problems[randomIndex];
    
    console.log(`🎯 Selected problem: ${currentProblem.id} (index ${randomIndex})`);
    console.log(`   📝 Title: ${currentProblem.title}`);
    console.log(`   🎚️  Difficulty: ${currentProblem.difficulty}`);
    console.log(`   🏷️  Type: ${currentProblem.type}`);
    console.log(`   💰 Points: ${currentProblem.points}`);
    console.log(`   📊 FEN: ${currentProblem.fen}`);
    console.log(`   🧩 Solution:`, currentProblem.solution);
    
    // Tilbakestill tilstand
    currentHintIndex = 0;
    currentMoveIndex = 0;
    isWaitingForOpponentMove = false;
    
    // Last posisjonen
    loadPosition(currentProblem.fen);
    setBoardOrientation(currentProblem.toMove);
    updateProblemDisplay();
    hideFeedback();
    hideSolution();
    
    // Oppdater knappetilstander
    updateButtonStates();
    
    console.log(`✅ Problem ${currentProblem.id} loaded successfully - ${currentProblem.type} (${currentProblem.difficulty})`);
    console.log('🔄 loadRandomProblem() - END');
}

/**
 * Oppdater problemvisningen
 */
function updateProblemDisplay() {
    if (!currentProblem) return;
    
    const titleElement = document.getElementById('problemTitle');
    const descriptionElement = document.getElementById('problemDescription');
    const difficultyElement = document.getElementById('problemDifficulty');
    const pointsElement = document.getElementById('problemPoints');
    
    if (titleElement) {
        titleElement.textContent = currentProblem.title;
    }
    
    if (descriptionElement) {
        descriptionElement.textContent = currentProblem.description;
    }
    
    if (difficultyElement) {
        difficultyElement.textContent = currentProblem.difficulty;
        difficultyElement.className = `badge difficulty-${currentProblem.difficulty}`;
    }
    
    if (pointsElement) {
        pointsElement.textContent = `${currentProblem.points} poeng`;
    }
}
