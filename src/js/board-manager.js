/**
 * ChessHawk - Board Manager
 * 
 * Håndterer sjakkbrett, interaksjon og visuell fremstilling
 * Modernized with ES2024+ features and ES6 modules
 */

// Color constants for square highlighting
const whiteSquareGrey = '#a9a9a9';
const blackSquareGrey = '#696969';

/**
 * BoardManager klasse for håndtering av sjakkbrett
 */
class BoardManager {
    #board = null;
    #config = null;
    #mobileHandlers = new Map();
    #isWaitingForOpponentMove = false;

    constructor() {
        this.#initializeConfig();
    }

    /**
     * Privat metode for å sette opp brettkonfigurasjon
     */
    #initializeConfig() {
        this.#config = {
            draggable: true,
            position: 'start',
            orientation: 'white', // Standard til hvite brikker på bunnen
            pieceTheme: 'src/img/chesspieces/wikipedia/{piece}.png',
            onDrop: this.onDrop.bind(this),
            onSnapEnd: this.onSnapEnd.bind(this),
            onMouseoutSquare: this.onMouseoutSquare.bind(this),
            onMouseoverSquare: this.onMouseoverSquare.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onDragMove: this.onDragMove.bind(this)
        };
    }

    /**
     * Initialiser sjakkbrettet med konfigurasjon
     */
    initializeBoard() {
        this.#board = Chessboard('myBoard', this.#config);
        
        // Legg til mobile touch event handlers
        this.#initializeMobileTouchHandlers();
        return this.#board;
    }

    /**
     * Privat metode for å initialisere mobile touch handlers
     */
    #initializeMobileTouchHandlers() {
        console.log('📱 Initializing mobile touch handlers...');
        
        // Legg til touch event listeners til brettcontaineren
        const boardElement = document.getElementById('myBoard');
        if (boardElement && 'ontouchstart' in window) {
            console.log('   📱 Mobile device detected - adding touch handlers');
            
            // Forhindre standard touch-oppførsel på brettet
            boardElement.addEventListener('touchstart', function(e) {
                console.log('📱 Touch start on chessboard');
                // Tillat at touch fortsetter for brikkevalg
            }, { passive: true });
            
            // Forhindre scrolling under brikkedragging
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
     * Få tilgang til board instance
     */
    get board() {
        return this.#board;
    }

    /**
     * Sett brettorientering basert på hvilken side som skal trekke
     * @param {string} toMove - 'w' for hvit, 'b' for svart
     */
    setBoardOrientation(toMove) {
        console.log(`🔄 === setBoardOrientation() START ===`);
        console.log(`   🎯 Problem ID: ${window.currentProblem?.id || 'UNKNOWN'}`);
        console.log(`   🔍 toMove parameter: ${toMove}`);
        
        if (!this.#board) {
            console.error('❌ ERROR - Board not initialized');
            return;
        }
        
        // Bestem orientering basert på hvem som skal trekke
        const orientation = toMove === 'b' ? 'black' : 'white';
        
        console.log(`   🎨 Setting board orientation: ${orientation}`);
        console.log(`   📝 Logic: ${toMove === 'b' ? 'Black to move → black pieces on bottom' : 'White to move → white pieces on bottom'}`);
        
        try {
            this.#board.orientation(orientation);
            console.log(`   ✅ Board orientation updated successfully to: ${orientation}`);
        } catch (error) {
            console.error(`   ❌ ERROR setting board orientation:`, error);
        }
        
        console.log(`🔄 === setBoardOrientation() END ===`);
    }

    /**
     * Håndter brikkedrop-hendelser
     * @param {string} source - Kilderute
     * @param {string} target - Målrute
     * @returns {string} 'snapback' hvis trekket er ulovlig
     */
    onDrop(source, target) {
        console.log(`🎲 === onDrop() START ===`);
        console.log(`   🎯 Problem ID: ${window.currentProblem?.id || 'NO PROBLEM'}`);
        console.log(`   🎲 Move attempt: ${source} → ${target}`);
        console.log(`   ⏳ Waiting for opponent: ${window.isWaitingForOpponentMove}`);
        console.log(`   📊 Current position: ${window.game?.fen()}`);
        
        // Rydd opp dragging-tilstand
        document.body.classList.remove('dragging');
        if ('ontouchstart' in window) {
            document.removeEventListener('touchmove', this.#preventTouchMove);
        }
        
        // Ikke tillat trekk hvis vi venter på motstanderen
        if (window.isWaitingForOpponentMove) {
            console.log(`⏳ BLOCKING move - waiting for opponent in problem ${window.currentProblem?.id}`);
            return 'snapback';
        }
        
        // Forsøk å gjøre trekket
        console.log(`   🔄 Attempting to make move: ${source} → ${target}`);
        const move = window.game?.move({
            from: source,
            to: target,
            promotion: 'q' // Alltid promoter til dronning for enkelhets skyld
        });
        
        // Ulovlig trekk
        if (move === null) {
            console.log(`❌ === ILLEGAL MOVE in problem ${window.currentProblem?.id || 'NO PROBLEM'} ===`);
            console.log(`   🎲 Attempted: ${source} → ${target}`);
            console.log(`   📊 Current position: ${window.game?.fen()}`);
            console.log(`   🔍 Legal moves:`, window.game?.moves());
            return 'snapback';
        }
        
        console.log(`✅ === LEGAL MOVE made in problem ${window.currentProblem?.id} ===`);
        console.log(`   🎲 Move: ${move.san} (${source} → ${target})`);
        console.log(`   📊 New position: ${window.game?.fen()}`);
        console.log(`   🎯 Move details:`, move);
        
        // Oppdater statusen etter vellykket trekk
        if (window.updateStatus) {
            window.updateStatus();
        }
        
        // For sekvensproblemer, sjekk automatisk om trekket er riktig
        if (window.currentProblem && Array.isArray(window.currentProblem.solution)) {
            console.log(`   🔄 Auto-checking move for sequence problem ${window.currentProblem.id}`);
            setTimeout(() => {
                if (window.checkSolution) {
                    window.checkSolution();
                }
            }, 100);
        }
        
        console.log(`🎲 === onDrop() END ===`);
    }

    /**
     * Håndter slutten av brikkesnapp-animasjonen
     */
    onSnapEnd() {
        this.#board?.position(window.game?.fen());
        
        // Fjern dragging-klasse og touch event listeners
        document.body.classList.remove('dragging');
        if ('ontouchstart' in window) {
            document.removeEventListener('touchmove', this.#preventTouchMove);
        }
    }

    /**
     * Håndter museover-rutehendelser for trekkutheving
     * @param {string} square - Ruten som mus er over
     * @param {string} piece - Brikken på ruten (hvis noen)
     */
    onMouseoverSquare(square, piece) {
        // Få liste over mulige trekk for denne ruten
        const moves = window.game?.moves({
            square: square,
            verbose: true
        });
        
        // Avslutt hvis det ikke er noen tilgjengelige trekk for denne ruten
        if (!moves || moves.length === 0) return;
        
        // Uthev ruten de pekte på
        this.#greySquare(square);
        
        // Uthev de mulige rutene for denne brikken
        for (let i = 0; i < moves.length; i++) {
            this.#greySquare(moves[i].to);
        }
    }

    /**
     * Håndter museut-rutehendelser
     * @param {string} square - Ruten som forlates
     * @param {string} piece - Brikken på ruten (hvis noen)
     */
    onMouseoutSquare(square, piece) {
        this.#removeGreySquares();
    }

    /**
     * Fjern all ruteutheving (privat metode)
     */
    #removeGreySquares() {
        $('#myBoard .square-55d63').css('background', '');
    }

    /**
     * Uthev en spesifikk rute (privat metode)
     * @param {string} square - Ruten som skal utheves
     */
    #greySquare(square) {
        const $square = $('#myBoard .square-' + square);
        
        let background = whiteSquareGrey;
        if ($square.hasClass('black-3c85d')) {
            background = blackSquareGrey;
        }
        
        $square.css('background', background);
    }

    /**
     * Last en spesifikk posisjon fra FEN-notasjon
     * @param {string} fen - FEN-streng som representerer posisjonen
     */
    loadPosition(fen) {
        window.game?.load(fen);
        this.#board?.position(fen);
        if (window.updateStatus) {
            window.updateStatus();
        }
    }

    /**
     * Håndter drag start-hendelser
     * @param {string} source - Kilderute
     * @param {Object} piece - Brikke som dras
     * @param {string} position - Nåværende brettposisjon
     * @param {string} orientation - Brettorientering
     */
    onDragStart(source, piece, position, orientation) {
        console.log(`🎯 Drag start: ${piece} from ${source}`);
        
        // Legg til dragging-klasse til body for mobile enheter
        document.body.classList.add('dragging');
        
        // Legg til touch event listener for å forhindre scrolling på mobile
        if ('ontouchstart' in window) {
            document.addEventListener('touchmove', this.#preventTouchMove, { passive: false });
        }
        
        // Ikke tillat dra hvis spillet er over
        if (window.game?.isGameOver()) {
            console.log('Game is over - preventing drag');
            return false;
        }
        
        // Bare tillat spilleren å dra sine egne brikker
        if ((window.game?.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (window.game?.turn() === 'b' && piece.search(/^w/) !== -1)) {
            console.log('Wrong turn - preventing drag');
            return false;
        }
        
        // Ikke tillat dra hvis vi venter på motstanderen
        if (window.isWaitingForOpponentMove) {
            console.log('Waiting for opponent - preventing drag');
            return false;
        }
    }

    /**
     * Håndter drag move-hendelser
     * @param {string} newLocation - Ny posisjon av brikken
     * @param {string} oldLocation - Gammel posisjon av brikken
     * @param {string} source - Kilderute
     * @param {Object} piece - Brikke som dras
     * @param {string} position - Nåværende brettposisjon
     * @param {string} orientation - Brettorientering
     */
    onDragMove(newLocation, oldLocation, source, piece, position, orientation) {
        // Denne funksjonen kan brukes til å legge til visuell feedback under dragging
        // For nå holder vi den enkel
    }

    /**
     * Forhindre touch move for å unngå scrolling under dragging (privat metode)
     * @param {Event} e - Touch move-hendelse
     */
    #preventTouchMove(e) {
        e.preventDefault();
    }
}

// Export the class as default
export default BoardManager;

// Expose to global scope for compatibility with existing code
window.BoardManager = BoardManager;
