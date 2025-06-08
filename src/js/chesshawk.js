/**
 * ChessHawk - Main Game Logic
 * 
 * A chess training application that presents chess problems
 * without revealing whether they require tactical or strategic solutions.
 */

// Global variables
let game;
let board;
let problems = [];
let currentProblem = null;
let currentHintIndex = 0;
let playerScore = 0;
let solvedProblems = [];
let currentMoveIndex = 0; // Track which move in the sequence we're on
let isWaitingForOpponentMove = false; // Flag to indicate if we're waiting for opponent response

// Color constants for square highlighting
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';

/**
 * Initialize the ChessHawk application
 */
function initChessHawk() {
    console.log('🚀 === ChessHawk INITIALIZATION START ===');
    
    // Check if required libraries are loaded
    console.log('   📚 Checking required libraries...');
    if (!checkLibraries()) {
        console.error('❌ Library check failed - aborting initialization');
        return;
    }
    console.log('   ✅ All libraries loaded successfully');

    // Initialize chess game logic
    console.log('   ♟️  Initializing chess game engine...');
    try {
        game = new Chess();
        console.log('   ✅ Chess game engine initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing chess game:', error);
        return;
    }
    
    // Initialize the chessboard
    console.log('   🏁 Initializing chessboard UI...');
    try {
        initializeBoard();
        console.log('   ✅ Chessboard initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing chessboard:', error);
        return;
    }
    
    // Load problems from JSON file
    console.log('   📂 Loading problems...');
    loadProblems(); // This is async, so it will continue in background
    
    // Initialize event listeners
    console.log('   🔘 Initializing event listeners...');
    try {
        initializeEventListeners();
        console.log('   ✅ Event listeners initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing event listeners:', error);
    }
    
    // Initialize the status display
    console.log('   📊 Updating initial status...');
    try {
        updateStatus();
        console.log('   ✅ Status updated');
    } catch (error) {
        console.error('   ❌ ERROR updating status:', error);
    }
    
    console.log('🚀 === ChessHawk INITIALIZATION COMPLETE ===');
    console.log('   🎯 Application ready for use');
    console.log('   💡 Use debugAnalyzeProblems() to analyze loaded problems');
    console.log('   💡 Use debugTestProblem("problem_id") to test specific problems');
}

/**
 * Check if all required libraries are loaded
 * @returns {boolean} True if all libraries are loaded
 */
function checkLibraries() {
    console.log('   🔍 Checking chess.js library...');
    if (typeof Chess === 'undefined') {
        console.error('   ❌ chess.js library not loaded!');
        alert('Feil: chess.js-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    console.log('   ✅ chess.js library found');
    
    console.log('   🔍 Checking chessboard.js library...');
    if (typeof Chessboard === 'undefined') {
        console.error('   ❌ chessboard.js library not loaded!');
        alert('Feil: chessboard.js-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    console.log('   ✅ chessboard.js library found');
    
    console.log('   🔍 Checking jQuery library...');
    if (typeof $ === 'undefined') {
        console.error('   ❌ jQuery library not loaded!');
        alert('Feil: jQuery-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    console.log('   ✅ jQuery library found');
    
    return true;
}

/**
 * Initialize the chessboard with configuration
 */
function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        orientation: 'white', // Default to white on bottom
        pieceTheme: 'src/img/chesspieces/wikipedia/{piece}.png',
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onDragStart: onDragStart,
        onDragMove: onDragMove
    };
    
    board = Chessboard('myBoard', config);
    
    // Legg til mobile touch event handlers
    initializeMobileTouchHandlers();
}

/**
 * Set board orientation based on which side is to move
 * @param {string} toMove - 'w' for white, 'b' for black
 */
function setBoardOrientation(toMove) {
    console.log(`🔄 === setBoardOrientation() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    console.log(`   🔍 toMove parameter: ${toMove}`);
    
    if (!board) {
        console.error('❌ ERROR - Board not initialized');
        return;
    }
    
    // Determine orientation based on who is to move
    const orientation = toMove === 'b' ? 'black' : 'white';
    
    console.log(`   🎨 Setting board orientation: ${orientation}`);
    console.log(`   📝 Logic: ${toMove === 'b' ? 'Black to move → black pieces on bottom' : 'White to move → white pieces on bottom'}`);
    
    try {
        board.orientation(orientation);
        console.log(`   ✅ Board orientation updated successfully to: ${orientation}`);
    } catch (error) {
        console.error(`   ❌ ERROR setting board orientation:`, error);
    }
    
    console.log(`🔄 === setBoardOrientation() END ===`);
}

/**
 * Load problems from JSON file
 */
async function loadProblems() {
    console.log('📂 === loadProblems() START ===');
    
    try {
        console.log('   🌐 Fetching problems.json...');
        const response = await fetch('src/data/problems.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
          console.log(`   ✅ Fetch successful (status: ${response.status})`);
        const data = await response.json();
        
        // Validate data structure
        if (!data) {
            throw new Error('No data received from problems.json');
        }
        
        if (!data.problems || !Array.isArray(data.problems)) {
            throw new Error('Invalid data structure: problems array not found or not an array');
        }
        
        problems = data.problems;
        
        console.log(`   📊 === PROBLEMS LOADED ===`);
        console.log(`      📏 Total problems: ${problems.length}`);
        
        // Analyze loaded problems
        const problemsByType = {};
        const problemsByDifficulty = {};
        
        problems.forEach((problem, index) => {
            console.log(`      ${index + 1}. ${problem.id} (${problem.type}/${problem.difficulty}) - ${problem.title}`);
            
            // Count by type
            problemsByType[problem.type] = (problemsByType[problem.type] || 0) + 1;
            
            // Count by difficulty
            problemsByDifficulty[problem.difficulty] = (problemsByDifficulty[problem.difficulty] || 0) + 1;
            
            // Validate problem structure
            if (!problem.solution || problem.solution.length === 0) {
                console.error(`      ❌ ERROR - Problem ${problem.id} has no solution!`);
            }
            
            if (!problem.fen) {
                console.error(`      ❌ ERROR - Problem ${problem.id} has no FEN!`);
            }
        });
        
        console.log(`   📊 Problems by type:`, problemsByType);
        console.log(`   📊 Problems by difficulty:`, problemsByDifficulty);
        
        // Load first problem automatically
        if (problems.length > 0) {
            console.log('   🎯 Loading first problem automatically...');
            loadRandomProblem();
        } else {
            console.warn('   ⚠️  No problems found in JSON file');
        }
        
        console.log('📂 === loadProblems() END - SUCCESS ===');
    } catch (error) {
        console.error('❌ === loadProblems() ERROR ===');
        console.error('   💥 Error details:', error);
        console.error('   📚 Error stack:', error.stack);
        console.error('   🔍 Possible causes:');
        console.error('      - problems.json file not found');
        console.error('      - Invalid JSON syntax');
        console.error('      - Network connectivity issues');
        console.error('      - Server configuration problems');
        
        showFeedback('Feil ved lasting av problemer. Prøv igjen senere.', 'error');
    }
}

/**
 * Initialize event listeners for UI elements
 */
function initializeEventListeners() {
    const newProblemBtn = document.getElementById('newProblemBtn');
    const checkSolutionBtn = document.getElementById('checkSolutionBtn');
    const getHintBtn = document.getElementById('getHintBtn');
    const resetPositionBtn = document.getElementById('resetPositionBtn');
    const debugShowSolution = document.getElementById('debugShowSolution');
    const debugAnalyzeProblems = document.getElementById('debugAnalyzeProblems');
    
    if (newProblemBtn) {
        newProblemBtn.addEventListener('click', loadRandomProblem);
    }
    
    if (checkSolutionBtn) {
        checkSolutionBtn.addEventListener('click', checkSolution);
    }
    
    if (getHintBtn) {
        getHintBtn.addEventListener('click', showHint);
    }
    
    if (resetPositionBtn) {
        resetPositionBtn.addEventListener('click', resetToStartingPosition);
    }
    
    if (debugShowSolution) {
        debugShowSolution.addEventListener('click', function() {
            console.log('Debug show solution button clicked');
            console.log('Current problem:', currentProblem);
            showSolution();
        });
    }
    
    if (debugAnalyzeProblems) {
        debugAnalyzeProblems.addEventListener('click', function() {
            console.log('Debug analyze problems button clicked');
            debugAnalyzeProblems();
        });
    }
}

/**
 * Load a random problem from the problems array
 */
function loadRandomProblem() {
    console.log('🔄 loadRandomProblem() - START');
    
    if (problems.length === 0) {
        console.error('❌ ERROR - No problems available');
        showFeedback('Ingen problemer tilgjengelig', 'error');
        return;
    }
    
    // Get unsolved problems or all problems if all are solved
    const unsolvedProblems = problems.filter(p => !solvedProblems.includes(p.id));
    const availableProblems = unsolvedProblems.length > 0 ? unsolvedProblems : problems;
    
    console.log(`📊 Problems summary - Total: ${problems.length}, Unsolved: ${unsolvedProblems.length}, Available: ${availableProblems.length}`);
    console.log('📋 Solved problems list:', solvedProblems);
    
    // Select random problem
    const randomIndex = Math.floor(Math.random() * availableProblems.length);
    currentProblem = availableProblems[randomIndex];
    currentHintIndex = 0;
    currentMoveIndex = 0; // Reset move sequence
    isWaitingForOpponentMove = false; // Reset opponent move flag
    
    // Enhanced debug logging for problem details
    console.log('🎯 === PROBLEM LOADED ===');
    console.log(`   📌 ID: ${currentProblem.id}`);
    console.log(`   🏷️  Type: ${currentProblem.type}`);
    console.log(`   📝 Title: ${currentProblem.title}`);
    console.log(`   🎚️  Difficulty: ${currentProblem.difficulty}`);
    console.log(`   💰 Points: ${currentProblem.points}`);
    console.log(`   🎲 FEN: ${currentProblem.fen}`);
    console.log(`   🔍 Move to play: ${currentProblem.toMove === 'w' ? 'White' : 'Black'}`);
    
    // Solution analysis
    const isSequence = Array.isArray(currentProblem.solution);
    console.log(`   🧩 Solution type: ${isSequence ? 'SEQUENCE' : 'SINGLE/MULTIPLE'}`);
    console.log(`   📏 Solution length: ${currentProblem.solution.length}`);
    
    if (isSequence) {
        console.log('   🔗 Solution sequence:');
        currentProblem.solution.forEach((move, index) => {
            console.log(`      ${index + 1}. ${move.move} - ${move.explanation}`);
            if (move.opponentResponse) {
                console.log(`         ↳ Opponent: ${move.opponentResponse}`);
            }
        });
    } else {
        console.log('   🎯 Solution moves:');
        currentProblem.solution.forEach((move, index) => {
            console.log(`      ${index + 1}. ${move.move} (${move.from}-${move.to}) - ${move.explanation}`);
        });
    }
    
    // Hints analysis
    if (currentProblem.hints && currentProblem.hints.length > 0) {
        console.log(`   💡 Hints available: ${currentProblem.hints.length}`);
        currentProblem.hints.forEach((hint, index) => {
            console.log(`      ${index + 1}. ${hint}`);
        });
    } else {
        console.log('   💡 No hints available');
    }
      // Load problem position
    try {
        loadPosition(currentProblem.fen);
        console.log(`✅ Position loaded successfully for problem ${currentProblem.id}`);
    } catch (error) {
        console.error(`❌ ERROR loading position for problem ${currentProblem.id}:`, error);
        showFeedback('Feil ved lasting av posisjon', 'error');
        return;
    }
    
    // Set board orientation based on who is to move
    try {
        setBoardOrientation(currentProblem.toMove);
        console.log(`✅ Board orientation set for problem ${currentProblem.id}`);
    } catch (error) {
        console.error(`❌ ERROR setting board orientation for problem ${currentProblem.id}:`, error);
    }
    
    // Update UI
    updateProblemDisplay();
    hideFeedback();
    hideSolution();
    
    // Update button states
    updateButtonStates();
    
    console.log(`✅ Problem ${currentProblem.id} loaded successfully - ${currentProblem.type} (${currentProblem.difficulty})`);
    console.log('🔄 loadRandomProblem() - END');
}

/**
 * Update problem information display
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

/**
 * Check if the current position matches the solution
 */
function checkSolution() {
    console.log('🔍 === checkSolution() START ===');
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'NO PROBLEM'}`);
    console.log(`   🏷️  Problem Type: ${currentProblem?.type || 'NO TYPE'}`);
    console.log(`   📊 currentMoveIndex: ${currentMoveIndex}`);
    console.log(`   ⏳ isWaitingForOpponentMove: ${isWaitingForOpponentMove}`);
    
    if (!currentProblem) {
        console.error(`❌ CRITICAL ERROR - No problem loaded! Cannot check solution.`);
        showFeedback('Ingen problem lastet', 'error');
        return;
    }
    
    if (isWaitingForOpponentMove) {
        console.warn(`⚠️  WARNING - Still waiting for opponent move in problem: ${currentProblem.id}`);
        showFeedback('Venter på motstanderens trekk...', 'error');
        return;
    }
    
    // Get game history
    const history = game.history({ verbose: true });
    console.log(`📜 Game history for problem ${currentProblem.id} (${history.length} moves):`, history);
    
    if (history.length === 0) {
        console.warn(`⚠️  WARNING - No moves made yet in problem: ${currentProblem.id}`);
        showFeedback('Du må gjøre et trekk først!', 'error');
        return;
    }
    
    const lastMove = history[history.length - 1];
    const playerMove = lastMove.san;
    
    console.log(`🎲 Player move in problem ${currentProblem.id}: ${playerMove} (${lastMove.from}-${lastMove.to})`);
    
    // Check if we have a move sequence (array) or single move (object)
    const isSequence = Array.isArray(currentProblem.solution);
    console.log(`🧩 Problem ${currentProblem.id} solution type: ${isSequence ? 'SEQUENCE' : 'SINGLE/MULTIPLE'}`);
    
    let expectedMove;
    let expectedMoveStr;
    
    if (isSequence) {
        // Multi-move sequence
        if (currentMoveIndex >= currentProblem.solution.length) {
            console.error(`❌ ERROR - Move index ${currentMoveIndex} exceeds solution length ${currentProblem.solution.length} for problem ${currentProblem.id}`);
            showFeedback('Sekvensen er allerede fullført!', 'error');
            return;
        }
        expectedMove = currentProblem.solution[currentMoveIndex];
        expectedMoveStr = expectedMove.move;
        console.log(`🎯 Expected move for sequence problem ${currentProblem.id} at index ${currentMoveIndex}: ${expectedMoveStr}`);
        console.log(`   📝 Move explanation: "${expectedMove.explanation}"`);
        if (expectedMove.opponentResponse) {
            console.log(`   🤖 Opponent response planned: ${expectedMove.opponentResponse}`);
        }
    } else {
        // Single move problem (legacy format or tactical with alternative moves)
        expectedMove = currentProblem.solution.find(sol => 
            sol.move === playerMove || 
            (sol.from === lastMove.from && sol.to === lastMove.to)
        );
        expectedMoveStr = expectedMove ? expectedMove.move : 'No matching move found';
        console.log(`🎯 Checking single-move problem ${currentProblem.id} for move: ${playerMove}`);
        console.log(`   🔍 Expected move found: ${expectedMove ? 'YES' : 'NO'} - ${expectedMoveStr}`);
        if (expectedMove) {
            console.log(`   📝 Move explanation: "${expectedMove.explanation}"`);
        }
    }
    
    // Check if the move is correct
    const isCorrect = isSequence ? 
        (expectedMove.move === playerMove || 
         (expectedMove.from === lastMove.from && expectedMove.to === lastMove.to)) :
        (expectedMove !== undefined);
    
    console.log(`✅❌ Move validation result for problem ${currentProblem.id}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   🎲 Player played: ${playerMove}`);
    console.log(`   🎯 Expected: ${expectedMoveStr}`);
    
    if (isCorrect) {
        console.log(`✅ === CORRECT MOVE in problem ${currentProblem.id} ===`);
        console.log(`   🎉 Move: ${playerMove}`);
        console.log(`   📝 Explanation: "${expectedMove.explanation}"`);
        
        // Show success feedback
        showFeedback(`Riktig! ${expectedMove.explanation}`, 'success');
        
        if (isSequence) {
            console.log(`🔗 Processing sequence move ${currentMoveIndex + 1}/${currentProblem.solution.length}`);
            currentMoveIndex++;
            
            // Check if there's an opponent response to make
            if (expectedMove.opponentResponse) {
                console.log(`🤖 Scheduling opponent response: ${expectedMove.opponentResponse}`);
                isWaitingForOpponentMove = true;
                toggleButtonsEnabled(false);
                
                // Make opponent move after a short delay
                setTimeout(() => {
                    makeOpponentMove(expectedMove.opponentResponse);
                }, 1000);
            }
            
            // Check if sequence is complete
            if (currentMoveIndex >= currentProblem.solution.length) {
                console.log(`🏆 === SEQUENCE COMPLETE for problem ${currentProblem.id} ===`);
                console.log(`   💰 Points awarded: ${currentProblem.points}`);
                
                // Sequence complete
                playerScore += currentProblem.points;
                solvedProblems.push(currentProblem.id);
                
                showFeedback('Sekvensen fullført! Perfekt løsning!', 'success');
                showSolution();
                updateScore();
                
                // Disable check solution button
                const checkBtn = document.getElementById('checkSolutionBtn');
                if (checkBtn) checkBtn.disabled = true;
                
                console.log(`   📊 Updated score: ${playerScore}`);
                console.log(`   📋 Solved problems: [${solvedProblems.join(', ')}]`);
            }
        } else {
            console.log(`🏆 === SINGLE MOVE PROBLEM SOLVED: ${currentProblem.id} ===`);
            console.log(`   💰 Points awarded: ${currentProblem.points}`);
            
            // Single move problem - mark as solved
            playerScore += currentProblem.points;
            solvedProblems.push(currentProblem.id);
            
            showSolution();
            updateScore();
            
            // Disable check solution button
            const checkBtn = document.getElementById('checkSolutionBtn');
            if (checkBtn) checkBtn.disabled = true;
            
            console.log(`   📊 Updated score: ${playerScore}`);
            console.log(`   📋 Solved problems: [${solvedProblems.join(', ')}]`);
        }
    } else {
        console.log(`❌ === INCORRECT MOVE in problem ${currentProblem.id} ===`);
        console.log(`   🎲 Player played: ${playerMove} (${lastMove.from}-${lastMove.to})`);
        console.log(`   🎯 Expected: ${expectedMoveStr}`);
        console.log(`   🔄 Initiating snapback...`);
        
        // Incorrect move - undo it (snapback)
        showFeedback('Ikke riktig trekk. Prøv igjen!', 'error');
        undoLastMove();
    }
    
    console.log('🔍 === checkSolution() END ===');
}

/**
 * Show a hint for the current problem
 */
function showHint() {
    console.log(`💡 === showHint() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'NO PROBLEM'}`);
    console.log(`   📊 Current hint index: ${currentHintIndex}`);
    
    if (!currentProblem || !currentProblem.hints) {
        console.warn(`⚠️  No hints available for problem ${currentProblem?.id || 'NO PROBLEM'}`);
        showFeedback('Ingen hint tilgjengelig', 'error');
        return;
    }
    
    console.log(`   📏 Total hints available: ${currentProblem.hints.length}`);
    console.log(`   📋 All hints:`, currentProblem.hints);
    
    if (currentHintIndex >= currentProblem.hints.length) {
        console.warn(`⚠️  All hints already shown for problem ${currentProblem.id} (${currentHintIndex}/${currentProblem.hints.length})`);
        showFeedback('Alle hint er allerede vist', 'error');
        return;
    }
    
    const hint = currentProblem.hints[currentHintIndex];
    console.log(`   💡 Showing hint ${currentHintIndex + 1}/${currentProblem.hints.length}: "${hint}"`);
    
    showFeedback(`Hint ${currentHintIndex + 1}: ${hint}`, 'hint');
    currentHintIndex++;
    
    console.log(`   📊 Updated hint index: ${currentHintIndex}`);
    
    // Disable hint button if no more hints
    if (currentHintIndex >= currentProblem.hints.length) {
        const hintBtn = document.getElementById('getHintBtn');
        if (hintBtn) {
            hintBtn.disabled = true;
            console.log(`   🔒 Hint button disabled - no more hints available`);
        } else {
            console.warn(`   ⚠️  Hint button not found in DOM`);
        }
    }
    
    console.log(`💡 === showHint() END ===`);
}

/**
 * Reset to the problem's starting position
 */
function resetToStartingPosition() {
    console.log(`🔄 === resetToStartingPosition() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'NO PROBLEM'}`);
    
    if (!currentProblem) {
        console.warn(`⚠️  No current problem - resetting to chess start position`);
        resetGame();
        return;
    }
    
    console.log(`   📊 Resetting to FEN: ${currentProblem.fen}`);
    console.log(`   🔄 Resetting state variables:`);
    console.log(`      currentHintIndex: ${currentHintIndex} → 0`);
    console.log(`      currentMoveIndex: ${currentMoveIndex} → 0`);
    console.log(`      isWaitingForOpponentMove: ${isWaitingForOpponentMove} → false`);
    
    try {
        loadPosition(currentProblem.fen);
        console.log(`   ✅ Position loaded successfully`);
    } catch (error) {
        console.error(`   ❌ ERROR loading position:`, error);
        showFeedback('Feil ved lasting av posisjon', 'error');
        return;
    }
    
    // Reset board orientation to match the problem
    try {
        setBoardOrientation(currentProblem.toMove);
        console.log(`   ✅ Board orientation reset for problem ${currentProblem.id}`);
    } catch (error) {
        console.error(`   ❌ ERROR setting board orientation during reset:`, error);
    }
    
    hideFeedback();
    hideSolution();
    currentHintIndex = 0;
    currentMoveIndex = 0; // Reset move sequence
    isWaitingForOpponentMove = false; // Reset opponent move flag
    updateButtonStates();
    
    console.log(`   🎯 Reset complete for problem ${currentProblem.id}`);
    console.log(`🔄 === resetToStartingPosition() END ===`);
}

/**
 * Make an opponent move automatically
 * @param {string} moveNotation - The move in algebraic notation (e.g., "Kxf7")
 */
function makeOpponentMove(moveNotation) {
    console.log(`🤖 === makeOpponentMove() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    console.log(`   🎲 Move to make: ${moveNotation}`);
    console.log(`   📊 Current position FEN: ${game.fen()}`);
    
    try {
        const move = game.move(moveNotation);
        if (move) {
            console.log(`✅ Opponent move successful in problem ${currentProblem.id}:`);
            console.log(`   🎲 Move made: ${moveNotation} (${move.from}-${move.to})`);
            console.log(`   📊 New position FEN: ${game.fen()}`);
            console.log(`   🎯 Move details:`, move);
            
            board.position(game.fen());
            updateStatus();
            
            showFeedback(`Motstanderen spiller: ${moveNotation}`, 'hint');
            
            // Re-enable buttons after opponent move
            setTimeout(() => {
                isWaitingForOpponentMove = false;
                toggleButtonsEnabled(true);
                hideFeedback(); // Clear the opponent move message
                console.log(`🔄 Buttons re-enabled after opponent move in problem ${currentProblem.id}`);
                console.log(`🤖 === makeOpponentMove() END - SUCCESS ===`);
            }, 1500);
        } else {
            console.error(`❌ CRITICAL ERROR - Failed to make opponent move in problem ${currentProblem.id}:`);
            console.error(`   🎲 Attempted move: ${moveNotation}`);
            console.error(`   📊 Current position: ${game.fen()}`);
            console.error(`   🔍 Legal moves available:`, game.moves());
            
            isWaitingForOpponentMove = false;
            toggleButtonsEnabled(true);
            showFeedback('Feil ved motstanderens trekk', 'error');
        }
    } catch (error) {
        console.error(`❌ EXCEPTION in makeOpponentMove() for problem ${currentProblem.id}:`);
        console.error(`   🎲 Attempted move: ${moveNotation}`);
        console.error(`   📊 Current position: ${game.fen()}`);
        console.error(`   💥 Error details:`, error);
        console.error(`   📚 Error stack:`, error.stack);
        
        isWaitingForOpponentMove = false;
        toggleButtonsEnabled(true);
        showFeedback('Feil ved motstanderens trekk', 'error');
        
        console.log(`🤖 === makeOpponentMove() END - ERROR ===`);
    }
}

/**
 * Toggle button enabled/disabled state
 * @param {boolean} enabled - Whether buttons should be enabled
 */
function toggleButtonsEnabled(enabled) {
    console.log(`🔘 toggleButtonsEnabled(${enabled}) for problem ${currentProblem?.id || 'UNKNOWN'}`);
    
    const checkBtn = document.getElementById('checkSolutionBtn');
    const hintBtn = document.getElementById('getHintBtn');
    const resetBtn = document.getElementById('resetPositionBtn');
    const newProblemBtn = document.getElementById('newProblemBtn');
    
    const buttons = [
        { btn: checkBtn, name: 'checkSolution' },
        { btn: hintBtn, name: 'hint' },
        { btn: resetBtn, name: 'reset' },
        { btn: newProblemBtn, name: 'newProblem' }
    ];
    
    buttons.forEach(({ btn, name }) => {
        if (btn) {
            btn.disabled = !enabled;
            console.log(`   ${enabled ? '✅' : '🔒'} ${name} button: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        } else {
            console.warn(`   ⚠️  ${name} button not found in DOM`);
        }
    });
}

/**
 * Undo the last move (snapback functionality)
 */
function undoLastMove() {
    console.log(`🔄 undoLastMove() called for problem ${currentProblem?.id || 'UNKNOWN'}`);
    
    const history = game.history();
    console.log(`   📜 Current history length: ${history.length}`);
    
    if (history.length > 0) {
        const lastMove = history[history.length - 1];
        console.log(`   ⏪ Undoing move: ${lastMove}`);
        
        game.undo();
        board.position(game.fen());
        updateStatus();
        
        console.log(`   ✅ Move undone successfully`);
        console.log(`   📊 New position FEN: ${game.fen()}`);
        console.log(`   📜 New history length: ${game.history().length}`);
    } else {
        console.warn(`   ⚠️  No moves to undo for problem ${currentProblem?.id}`);
    }
}

/**
 * Show solution for the current problem
 */
function showSolution() {
    console.log(`📖 === showSolution() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'NO PROBLEM'}`);
    
    if (!currentProblem) {
        console.error('❌ ERROR - No current problem to show solution for');
        return;
    }
    
    const solutionElement = document.getElementById('solution');
    console.log(`   🔍 Solution element found: ${solutionElement ? 'YES' : 'NO'}`);
    
    if (!solutionElement) {
        console.error('❌ ERROR - Solution element not found in DOM!');
        return;
    }
    
    console.log(`   🧩 Solution type: ${Array.isArray(currentProblem.solution) ? 'SEQUENCE' : 'SINGLE/MULTIPLE'}`);
    console.log(`   📏 Solution length: ${currentProblem.solution.length}`);
    
    let solutionHtml = '<h4>Løsning:</h4>';
    
    // Check if solution is an array (sequence) or legacy format
    const isSequence = Array.isArray(currentProblem.solution);
    
    if (isSequence) {
        console.log(`   🔗 Rendering sequence solution for problem ${currentProblem.id}:`);
        
        // Multi-move sequence
        currentProblem.solution.forEach((sol, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            const movePrefix = isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`;
            
            console.log(`      ${index + 1}. ${movePrefix} ${sol.move} - ${sol.explanation}`);
            
            solutionHtml += `<p><span class="solution-move">${movePrefix} ${sol.move}</span> - ${sol.explanation}`;
            
            if (sol.opponentResponse) {
                const nextMoveNumber = isWhiteMove ? moveNumber : moveNumber + 1;
                const responsePrefix = isWhiteMove ? `${moveNumber}...` : `${nextMoveNumber}.`;
                solutionHtml += `<br><span class="solution-move">${responsePrefix} ${sol.opponentResponse}</span> - Motstanderens svar`;
                console.log(`         ↳ Opponent: ${responsePrefix} ${sol.opponentResponse}`);
            }
            
            solutionHtml += `</p>`;
        });
    } else {
        console.log(`   🎯 Rendering single/multiple move solution for problem ${currentProblem.id}:`);
        
        // Legacy format - array of solution objects
        currentProblem.solution.forEach((sol, index) => {
            console.log(`      ${index + 1}. ${sol.move} (${sol.from || 'unknown'}-${sol.to || 'unknown'}) - ${sol.explanation}`);
            solutionHtml += `<p><span class="solution-move">${sol.move}</span> - ${sol.explanation}</p>`;
        });
    }
    
    console.log(`   📝 Generated HTML length: ${solutionHtml.length} characters`);
    console.log(`   🎨 Setting solution HTML...`);
    
    solutionElement.innerHTML = solutionHtml;
    solutionElement.style.display = 'block';
    solutionElement.style.visibility = 'visible';
    solutionElement.classList.add('solution-visible');
    
    // Verify display
    const computedStyle = window.getComputedStyle(solutionElement);
    console.log(`   ✅ Solution display verification:`);
    console.log(`      Style display: ${solutionElement.style.display}`);
    console.log(`      Computed display: ${computedStyle.display}`);
    console.log(`      Style visibility: ${solutionElement.style.visibility}`);
    console.log(`      Classes: ${solutionElement.className}`);
    
    console.log(`📖 === showSolution() END - Solution displayed for problem ${currentProblem.id} ===`);
}

/**
 * Hide solution display
 */
function hideSolution() {
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        solutionElement.style.display = 'none';
        solutionElement.classList.remove('solution-visible');
    }
}

/**
 * Show feedback message
 * @param {string} message - The message to show
 * @param {string} type - The type of feedback (success, error, hint)
 */
function showFeedback(message, type = 'success') {
    console.log(`💬 === showFeedback() ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    console.log(`   📝 Message: "${message}"`);
    console.log(`   🏷️  Type: ${type}`);
    
    const feedbackElement = document.getElementById('feedback');
    console.log(`   🔍 Feedback element found: ${feedbackElement ? 'YES' : 'NO'}`);
    
    if (!feedbackElement) {
        console.error('❌ ERROR - Feedback element not found in DOM!');
        return;
    }
    
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback ${type}`;
    feedbackElement.style.display = 'block';
    
    console.log(`   ✅ Feedback displayed successfully`);
    console.log(`   🎨 Element display style: ${feedbackElement.style.display}`);
    console.log(`   🎨 Element classes: ${feedbackElement.className}`);
}

/**
 * Hide feedback display
 */
function hideFeedback() {
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}

/**
 * Update button states based on current game state
 */
function updateButtonStates() {
    const checkBtn = document.getElementById('checkSolutionBtn');
    const hintBtn = document.getElementById('getHintBtn');
    const resetBtn = document.getElementById('resetPositionBtn');
    
    if (checkBtn) {
        checkBtn.disabled = false;
    }
    
    if (hintBtn) {
        hintBtn.disabled = false;
    }
    
    if (resetBtn) {
        resetBtn.disabled = false;
    }
}

/**
 * Update score display
 */
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Total poeng: ${playerScore}`;
    }
}

/**
 * Update the game status display
 */
function updateStatus() {
    let status = '';
    
    let moveColor = 'Hvit';
    if (game.turn() === 'b') {
        moveColor = 'Svart';
    }
    
    // Check for game over conditions
    if (game.in_checkmate()) {
        status = 'Sjakkmatt, ' + moveColor + ' tapte.';
    } else if (game.in_draw()) {
        status = 'Remis';
    } else {
        status = moveColor + ' sin tur';
        
        // Check if in check
        if (game.in_check()) {
            status += ', ' + moveColor + ' står i sjakk';
        }
    }
    
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

/**
 * Handle piece drop events
 * @param {string} source - Source square
 * @param {string} target - Target square
 * @returns {string} 'snapback' if move is illegal
 */
function onDrop(source, target) {
    console.log(`🎲 === onDrop() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'NO PROBLEM'}`);
    console.log(`   🎲 Move attempt: ${source} → ${target}`);
    console.log(`   ⏳ Waiting for opponent: ${isWaitingForOpponentMove}`);
    console.log(`   📊 Current position: ${game.fen()}`);
    
    // Clean up dragging state
    document.body.classList.remove('dragging');
    if ('ontouchstart' in window) {
        document.removeEventListener('touchmove', preventTouchMove);
    }
    
    // Don't allow moves if waiting for opponent
    if (isWaitingForOpponentMove) {
        console.log(`⏳ BLOCKING move - waiting for opponent in problem ${currentProblem?.id}`);
        return 'snapback';
    }
    
    // Attempt to make the move
    console.log(`   🔄 Attempting to make move: ${source} → ${target}`);
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });
    
    // Illegal move
    if (move === null) {
        console.log(`❌ === ILLEGAL MOVE in problem ${currentProblem?.id || 'NO PROBLEM'} ===`);
        console.log(`   🎲 Attempted: ${source} → ${target}`);
        console.log(`   📊 Current position: ${game.fen()}`);
        console.log(`   🔍 Legal moves:`, game.moves());
        return 'snapback';
    }
    
    console.log(`✅ === LEGAL MOVE made in problem ${currentProblem?.id} ===`);
    console.log(`   🎲 Move: ${move.san} (${source} → ${target})`);
    console.log(`   📊 New position: ${game.fen()}`);
    console.log(`   🎯 Move details:`, move);
    
    // Update the status after successful move
    updateStatus();
    
    // For sequence problems, automatically check if the move is correct
    if (currentProblem && Array.isArray(currentProblem.solution)) {
        console.log(`🔍 Auto-checking sequence move for problem ${currentProblem.id}:`);
        console.log(`   🧩 Solution type: SEQUENCE`);
        console.log(`   📊 Current move index: ${currentMoveIndex}`);
        console.log(`   📏 Sequence length: ${currentProblem.solution.length}`);
        
        // Give a small delay to allow the move animation to complete
        setTimeout(() => {
            console.log(`   ⏰ Auto-check delay complete, calling checkSolution()...`);
            checkSolution();
        }, 100);
    } else {
        console.log(`ℹ️  Manual checking required for problem ${currentProblem?.id || 'NO PROBLEM'}`);
        console.log(`   🧩 Solution type: ${currentProblem ? (Array.isArray(currentProblem.solution) ? 'SEQUENCE' : 'SINGLE/MULTIPLE') : 'UNKNOWN'}`);
    }
    
    console.log(`🎲 === onDrop() END ===`);
}

/**
 * Handle the end of piece snap animation
 */
function onSnapEnd() {
    board.position(game.fen());
    
    // Remove dragging class and touch event listeners
    document.body.classList.remove('dragging');
    if ('ontouchstart' in window) {
        document.removeEventListener('touchmove', preventTouchMove);
    }
}

/**
 * Handle mouse over square events for move highlighting
 * @param {string} square - The square being hovered over
 * @param {string} piece - The piece on the square (if any)
 */
function onMouseoverSquare(square, piece) {
    // Get list of possible moves for this square
    const moves = game.moves({
        square: square,
        verbose: true
    });
    
    // Exit if there are no moves available for this square
    if (moves.length === 0) return;
    
    // Highlight the square they moused over
    greySquare(square);
    
    // Highlight the possible squares for this piece
    for (let i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
}

/**
 * Handle mouse out square events
 * @param {string} square - The square being left
 * @param {string} piece - The piece on the square (if any)
 */
function onMouseoutSquare(square, piece) {
    removeGreySquares();
}

/**
 * Remove all square highlighting
 */
function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '');
}

/**
 * Highlight a specific square
 * @param {string} square - The square to highlight
 */
function greySquare(square) {
    const $square = $('#myBoard .square-' + square);
    
    let background = whiteSquareGrey;
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey;
    }
    
    $square.css('background', background);
}

/**
 * Load a specific position from FEN notation
 * @param {string} fen - FEN string representing the position
 */
function loadPosition(fen) {
    game.load(fen);
    board.position(fen);
    updateStatus();
}

/**
 * Reset the game to starting position
 */
function resetGame() {
    game.reset();
    board.start();
    updateStatus();
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', initChessHawk);

// Quick test function for debugging
function testSolutionDisplay() {
    console.log('Testing solution display...');
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        solutionElement.innerHTML = '<h4>Test Løsning:</h4><p><span class="solution-move">Test Move</span> - Test explanation</p>';
        solutionElement.style.display = 'block';
        solutionElement.classList.add('solution-visible');
        console.log('Test solution displayed');
        console.log('Element styles:', {
            display: solutionElement.style.display,
            visibility: solutionElement.style.visibility,
            classes: solutionElement.className
        });
    } else {
        console.log('Solution element not found!');
    }
}

/**
 * Debug function to analyze all loaded problems
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
        console.log(`   ✅ Solved: ${solvedProblems.includes(problem.id) ? 'YES' : 'NO'}`);
        
        // Analyze solution structure
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
                
                // Validate move structure
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
                
                // Validate move structure
                if (!move.move) {
                    console.error(`         ❌ ERROR - Missing move in solution ${moveIndex + 1}`);
                }
                if (!move.explanation) {
                    console.error(`         ❌ ERROR - Missing explanation in solution ${moveIndex + 1}`);
                }
            });
        }
        
        // Check FEN validity
        try {
            const testGame = new Chess();
            testGame.load(problem.fen);
            console.log(`   ✅ FEN is valid`);
        } catch (error) {
            console.error(`   ❌ ERROR - Invalid FEN: ${error.message}`);
        }
        
        // Check hints
        if (problem.hints && problem.hints.length > 0) {
            console.log(`   💡 Hints (${problem.hints.length}):`);
            problem.hints.forEach((hint, hintIndex) => {
                console.log(`      ${hintIndex + 1}. ${hint}`);
            });
        } else {
            console.log(`   💡 No hints available`);
        }
    });
    
    console.log('\n🔬 === DEBUG ANALYSIS COMPLETE ===');
}

/**
 * Debug function to test a specific problem by ID
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
    
    // Store current state
    const oldProblem = currentProblem;
    
    // Load the specific problem
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
        // Restore old problem
        currentProblem = oldProblem;
    }
}

/**
 * Test function for board orientation
 */
function debugTestBoardOrientation() {
    console.log('🔧 === DEBUG TEST BOARD ORIENTATION ===');
    
    // Test white to move problems
    const whiteToMoveProblems = problems.filter(p => p.toMove === 'w');
    console.log(`   ⚪ White to move problems: ${whiteToMoveProblems.length}`);
    whiteToMoveProblems.forEach(p => console.log(`      - ${p.id}: ${p.title}`));
    
    // Test black to move problems
    const blackToMoveProblems = problems.filter(p => p.toMove === 'b');
    console.log(`   ⚫ Black to move problems: ${blackToMoveProblems.length}`);
    blackToMoveProblems.forEach(p => console.log(`      - ${p.id}: ${p.title}`));
    
    // Test orientation for each type
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
 * Handle drag start events
 * @param {string} source - Source square
 * @param {Object} piece - Piece being dragged
 * @returns {boolean} false if drag should be prevented
 */
function onDragStart(source, piece) {
    // Don't allow moves if waiting for opponent
    if (isWaitingForOpponentMove) {
        console.log(`⏳ BLOCKING drag - waiting for opponent in problem ${currentProblem?.id}`);
        return false;
    }
    
    // Add dragging class to body to prevent scrolling
    document.body.classList.add('dragging');
    
    // Prevent default touch behavior on mobile
    if ('ontouchstart' in window) {
        document.addEventListener('touchmove', preventTouchMove, { passive: false });
    }
    
    return true;
}

/**
 * Handle drag move events
 * @param {string} newLocation - New location of piece being dragged
 */
function onDragMove(newLocation) {
    // Continue preventing scroll during drag
    if ('ontouchstart' in window) {
        document.addEventListener('touchmove', preventTouchMove, { passive: false });
    }
}

/**
 * Initialize mobile touch handlers to prevent scrolling during piece drag
 */
function initializeMobileTouchHandlers() {
    console.log('📱 Initializing mobile touch handlers...');
    
    // Add touch event listeners to the board container
    const boardElement = document.getElementById('myBoard');
    if (boardElement && 'ontouchstart' in window) {
        console.log('   📱 Mobile device detected - adding touch handlers');
        
        // Prevent default touch behavior on the board
        boardElement.addEventListener('touchstart', function(e) {
            console.log('📱 Touch start on chessboard');
            // Allow the touch to proceed for piece selection
        }, { passive: true });
        
        // Prevent scrolling during piece dragging
        boardElement.addEventListener('touchmove', function(e) {
            console.log('📱 Touch move on chessboard - preventing scroll');
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        console.log('   ✅ Mobile touch handlers initialized');
    } else {
        console.log('   💻 Desktop device - skipping mobile touch handlers');
    }
}

/**
 * Prevent touch move events during drag (to stop scrolling)
 * @param {Event} e - Touch event
 */
function preventTouchMove(e) {
    e.preventDefault();
    e.stopPropagation();
}
