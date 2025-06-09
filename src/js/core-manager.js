/**
 * ChessHawk - Core Manager
 * 
 * Håndterer grunnleggende initialisering og globale variabler
 */

// === GLOBALE VARIABLER ===
let game;
let board;
let problems = [];
let currentProblem = null;
let currentHintIndex = 0;
let playerScore = 0;
let solvedProblems = [];
let currentMoveIndex = 0; // Spor hvilket trekk i sekvensen vi er på
let isWaitingForOpponentMove = false; // Flagg for å indikere om vi venter på motstanderens respons

// Fargekonstanter for rutehøydepunkter
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';

/**
 * Initialiser ChessHawk-applikasjonen
 */
function initChessHawk() {
    console.log('🚀 === ChessHawk INITIALIZATION START ===');
    
    // Sjekk om nødvendige biblioteker er lastet
    console.log('   📚 Checking required libraries...');
    if (!checkLibraries()) {
        console.error('❌ Library check failed - aborting initialization');
        return;
    }
    console.log('   ✅ All libraries loaded successfully');

    // Initialiser sjakkmotoren
    console.log('   ♟️  Initializing chess game engine...');
    try {
        game = new Chess();
        console.log('   ✅ Chess game engine initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing chess game:', error);
        return;
    }
    
    // Initialiser sjakkbrettet
    console.log('   🏁 Initializing chessboard UI...');
    try {
        initializeBoard();
        console.log('   ✅ Chessboard initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing chessboard:', error);
        return;
    }
    
    // Last problemer fra JSON-fil
    console.log('   📂 Loading problems...');
    loadProblems(); // Dette er asynkront, så det vil fortsette i bakgrunnen
    
    // Initialiser event listeners
    console.log('   🔘 Initializing event listeners...');
    try {
        initializeEventListeners();
        console.log('   ✅ Event listeners initialized');
    } catch (error) {
        console.error('   ❌ ERROR initializing event listeners:', error);
    }
    
    // Initialiser statusvisningen
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
 * Sjekk om alle nødvendige biblioteker er lastet
 * @returns {boolean} True hvis alle biblioteker er lastet
 */
function checkLibraries() {
    const checks = [
        { name: 'jQuery', check: () => typeof $ !== 'undefined' },
        { name: 'Chess.js', check: () => typeof Chess !== 'undefined' },
        { name: 'ChessBoard.js', check: () => typeof Chessboard !== 'undefined' }
    ];
    
    let allLoaded = true;
    
    checks.forEach(({ name, check }) => {
        if (check()) {
            console.log(`   ✅ ${name} loaded`);
        } else {
            console.error(`   ❌ ${name} NOT loaded`);
            allLoaded = false;
        }
    });
    
    return allLoaded;
}

/**
 * Oppdater spillstatusvisningen
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
 * Initialiser event listeners for UI-elementer
 */
function initializeEventListeners() {
    const newProblemBtn = document.getElementById('newProblemBtn');
    const checkSolutionBtn = document.getElementById('checkSolutionBtn');
    const getHintBtn = document.getElementById('getHintBtn');
    const resetPositionBtn = document.getElementById('resetPositionBtn');
    const debugShowSolution = document.getElementById('debugShowSolution');
    const debugAnalyzeProblemsBtn = document.getElementById('debugAnalyzeProblems');
    
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
    
    if (debugAnalyzeProblemsBtn) {
        debugAnalyzeProblemsBtn.addEventListener('click', function() {
            console.log('Debug analyze problems button clicked');
            debugAnalyzeProblems();
        });
    }
}

// Initialiser applikasjonen når siden lastes
document.addEventListener('DOMContentLoaded', initChessHawk);
