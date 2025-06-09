/**
 * ChessHawk - Debug Tools
 * 
 * Debug og testverktøy for problemanalyse og utvikling
 */

/**
 * Debug-funksjon for å analysere alle lastede problemer
 */
function debugAnalyzeProblems() {
    console.log('🔬 === DEBUG PROBLEM ANALYSIS ===');
    
    if (!problems || problems.length === 0) {
        console.error('❌ No problems loaded!');
        return;
    }
    
    console.log(`📊 Total problems loaded: ${problems.length}`);
    console.log(`📋 Solved problems: [${solvedProblems.join(', ')}]`);
    
    problems.forEach((problem, index) => {
        console.log(`\n🎯 === PROBLEM ${index + 1}/${problems.length} ===`);
        console.log(`   📌 ID: ${problem.id}`);
        console.log(`   🏷️  Type: ${problem.type}`);
        console.log(`   📝 Title: ${problem.title}`);
        console.log(`   🎚️  Difficulty: ${problem.difficulty}`);
        console.log(`   💰 Points: ${problem.points}`);
        console.log(`   📊 FEN: ${problem.fen.substring(0, 50)}...`);
        console.log(`   ⏺️  To Move: ${problem.toMove === 'w' ? 'White' : 'Black'}`);
        console.log(`   ✅ Solved: ${solvedProblems.includes(problem.id) ? 'YES' : 'NO'}`);
        
        // Analyser løsningsstruktur
        console.log(`   🧩 Solution analysis:`);
        const isSequence = Array.isArray(problem.solution);
        console.log(`      Type: ${isSequence ? 'SEQUENCE' : 'SINGLE/MULTIPLE'}`);
        console.log(`      Length: ${problem.solution.length}`);
        
        if (isSequence) {
            problem.solution.forEach((move, moveIndex) => {
                console.log(`      ${moveIndex + 1}. ${move.move} - ${move.explanation}`);
                if (move.opponentResponse) {
                    console.log(`         ↳ Opponent: ${move.opponentResponse}`);
                }
                
                // Valider trekkstruktur
                if (!move.move) {
                    console.error(`         ❌ ERROR - Missing move in solution ${moveIndex + 1}`);
                }
                if (!move.explanation) {
                    console.error(`         ❌ ERROR - Missing explanation in solution ${moveIndex + 1}`);
                }
            });
        } else {
            problem.solution.forEach((move, moveIndex) => {
                console.log(`      ${moveIndex + 1}. ${move.move} (${move.from || 'no-from'}-${move.to || 'no-to'}) - ${move.explanation}`);
                
                // Valider trekkstruktur
                if (!move.move) {
                    console.error(`         ❌ ERROR - Missing move in solution ${moveIndex + 1}`);
                }
                if (!move.explanation) {
                    console.error(`         ❌ ERROR - Missing explanation in solution ${moveIndex + 1}`);
                }
            });
        }
        
        // Sjekk FEN-gyldighet
        try {
            const testGame = new Chess();
            testGame.load(problem.fen);
            console.log(`   ✅ FEN is valid`);
        } catch (error) {
            console.error(`   ❌ ERROR - Invalid FEN: ${error.message}`);
        }
        
        // Sjekk hint
        if (problem.hint) {
            console.log(`   💡 Hint: "${problem.hint}"`);
        } else {
            console.log(`   💡 No hint available`);
        }
    });
    
    console.log('\n🔬 === DEBUG ANALYSIS COMPLETE ===');
}

/**
 * Debug-funksjon for å teste et spesifikt problem med ID
 */
function debugTestProblem(problemId) {
    console.log(`🧪 === DEBUG TEST PROBLEM: ${problemId} ===`);
    
    const problem = problems.find(p => p.id === problemId);
    if (!problem) {
        console.error(`❌ Problem with ID "${problemId}" not found!`);
        console.log(`   📋 Available problem IDs:`, problems.map(p => p.id));
        return;
    }
    
    console.log(`   🎯 Found problem: ${problem.title}`);
    console.log(`   🔄 Loading problem...`);
    
    // Lagre nåværende tilstand
    const oldProblem = currentProblem;
    
    // Last det spesifikke problemet
    currentProblem = problem;
    currentHintIndex = 0;
    currentMoveIndex = 0;
    isWaitingForOpponentMove = false;
    
    try {
        loadPosition(problem.fen);
        setBoardOrientation(problem.toMove);
        updateProblemDisplay();
        hideFeedback();
        hideSolution();
        updateButtonStates();
        
        console.log(`   ✅ Problem ${problemId} loaded successfully for testing`);
        console.log(`   🎯 Board oriented for ${problem.toMove === 'w' ? 'white' : 'black'} to move`);
        console.log(`   💡 You can now test moves or use other debug functions`);
    } catch (error) {
        console.error(`   ❌ ERROR loading problem ${problemId}:`, error);
        // Gjenopprett gammelt problem
        currentProblem = oldProblem;
    }
}

/**
 * Testfunksjon for brettorientering
 */
function debugTestBoardOrientation() {
    console.log('🔧 === DEBUG TEST BOARD ORIENTATION ===');
    
    // Test hvit-til-trekk problemer
    const whiteToMoveProblems = problems.filter(p => p.toMove === 'w');
    console.log(`   ⚪ White to move problems: ${whiteToMoveProblems.length}`);
    whiteToMoveProblems.forEach(p => console.log(`      - ${p.id}: ${p.title}`));
    
    // Test svart-til-trekk problemer
    const blackToMoveProblems = problems.filter(p => p.toMove === 'b');
    console.log(`   ⚫ Black to move problems: ${blackToMoveProblems.length}`);
    blackToMoveProblems.forEach(p => console.log(`      - ${p.id}: ${p.title}`));
    
    // Test orientering for hver type
    if (whiteToMoveProblems.length > 0) {
        console.log(`   🔍 Testing white-to-move orientation with problem: ${whiteToMoveProblems[0].id}`);
        debugTestProblem(whiteToMoveProblems[0].id);
        setTimeout(() => {
            console.log(`   📝 Current board orientation: ${board.orientation()}`);
            console.log(`   ✅ Expected: white (white pieces on bottom)`);
            
            if (blackToMoveProblems.length > 0) {
                console.log(`   🔍 Testing black-to-move orientation with problem: ${blackToMoveProblems[0].id}`);
                debugTestProblem(blackToMoveProblems[0].id);
                setTimeout(() => {
                    console.log(`   📝 Current board orientation: ${board.orientation()}`);
                    console.log(`   ✅ Expected: black (black pieces on bottom)`);
                    console.log('🔧 === BOARD ORIENTATION TEST COMPLETE ===');
                }, 500);
            }
        }, 500);
    }
}

/**
 * Debug-funksjon for å teste løsningsvalidering
 */
function debugTestSolutionValidation() {
    console.log('🧪 === DEBUG TEST SOLUTION VALIDATION ===');
    
    if (!currentProblem) {
        console.error('❌ No current problem loaded!');
        return;
    }
    
    console.log(`   🎯 Testing solution validation for problem: ${currentProblem.id}`);
    console.log(`   🧩 Expected solution:`, currentProblem.solution);
    console.log(`   📊 Current position: ${game.fen()}`);
    console.log(`   🔍 Legal moves:`, game.moves());
    console.log(`   📜 Move history:`, game.history());
    
    // Test checkSolution function
    console.log(`   🔍 Testing checkSolution() function...`);
    try {
        checkSolution();
        console.log(`   ✅ checkSolution() executed without errors`);
    } catch (error) {
        console.error(`   ❌ ERROR in checkSolution():`, error);
    }
}

/**
 * Debug-funksjon for å teste UI-elementer
 */
function debugTestUIElements() {
    console.log('🎨 === DEBUG TEST UI ELEMENTS ===');
    
    const elements = [
        'feedback',
        'solution', 
        'problemTitle',
        'problemDescription',
        'problemDifficulty',
        'problemPoints',
        'status',
        'score'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`   ✅ ${id}: Found`);
            console.log(`      Display: ${element.style.display || 'default'}`);
            console.log(`      Visibility: ${element.style.visibility || 'default'}`);
            console.log(`      Classes: ${element.className || 'none'}`);
        } else {
            console.error(`   ❌ ${id}: NOT FOUND`);
        }
    });
}

/**
 * Debug-funksjon for å teste knappefunksjonalitet
 */
function debugTestButtons() {
    console.log('🔘 === DEBUG TEST BUTTONS ===');
    
    const buttons = [
        { id: 'newProblemBtn', name: 'New Problem', func: loadRandomProblem },
        { id: 'checkSolutionBtn', name: 'Check Solution', func: checkSolution },
        { id: 'getHintBtn', name: 'Get Hint', func: showHint },
        { id: 'resetPositionBtn', name: 'Reset Position', func: resetToStartingPosition },
        { id: 'debugShowSolution', name: 'Debug Show Solution', func: showSolution }
    ];
    
    buttons.forEach(({ id, name, func }) => {
        const button = document.getElementById(id);
        if (button) {
            console.log(`   ✅ ${name}: Found`);
            console.log(`      Disabled: ${button.disabled}`);
            console.log(`      Click handler: ${button.onclick ? 'Set' : 'Not set'}`);
            
            // Test function execution
            try {
                console.log(`      Testing ${name} function...`);
                func();
                console.log(`      ✅ ${name} function executed successfully`);
            } catch (error) {
                console.error(`      ❌ ERROR in ${name} function:`, error);
            }
        } else {
            console.error(`   ❌ ${name}: NOT FOUND`);
        }
    });
}

/**
 * Kjør alle debug-tester
 */
function debugRunAllTests() {
    console.log('🔬 === RUNNING ALL DEBUG TESTS ===');
    
    console.log('\n1. Testing UI Elements...');
    debugTestUIElements();
    
    console.log('\n2. Testing Buttons...');
    debugTestButtons();
    
    console.log('\n3. Testing Board Orientation...');
    debugTestBoardOrientation();
    
    console.log('\n4. Testing Solution Validation...');
    debugTestSolutionValidation();
    
    console.log('\n5. Analyzing Problems...');
    debugAnalyzeProblems();
    
    console.log('\n🔬 === ALL DEBUG TESTS COMPLETE ===');
}
