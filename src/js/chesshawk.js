/**
 * ChessHawk - Main Game Logic
 * 
 * A chess training application that presents chess problems
 * without revealing whether they require tactical or strategic solutions.
 */

// Global variables
let game;
let board;

// Color constants for square highlighting
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';

/**
 * Initialize the ChessHawk application
 */
function initChessHawk() {
    // Check if required libraries are loaded
    if (!checkLibraries()) {
        return;
    }

    // Initialize chess game logic
    game = new Chess();
    
    // Initialize the chessboard
    initializeBoard();
    
    // Initialize the status display
    updateStatus();
    
    console.log('ChessHawk initialized successfully!');
}

/**
 * Check if all required libraries are loaded
 * @returns {boolean} True if all libraries are loaded
 */
function checkLibraries() {
    if (typeof Chess === 'undefined') {
        console.error('chess.js library not loaded!');
        alert('Feil: chess.js-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    
    if (typeof Chessboard === 'undefined') {
        console.error('chessboard.js library not loaded!');
        alert('Feil: chessboard.js-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    
    if (typeof $ === 'undefined') {
        console.error('jQuery library not loaded!');
        alert('Feil: jQuery-biblioteket kunne ikke lastes inn. Sjekk internettforbindelsen.');
        return false;
    }
    
    return true;
}

/**
 * Initialize the chessboard with configuration
 */
function initializeBoard() {
    const config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'src/img/chesspieces/wikipedia/{piece}.png',
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare
    };
    
    board = Chessboard('myBoard', config);
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
    // Attempt to make the move
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });
    
    // Illegal move
    if (move === null) {
        return 'snapback';
    }
    
    // Update the status after successful move
    updateStatus();
}

/**
 * Handle the end of piece snap animation
 */
function onSnapEnd() {
    board.position(game.fen());
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
