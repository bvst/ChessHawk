/**
 * ChessHawk - Game Logic
 * 
 * Håndterer spillogikk, løsningsvalidering og trekksekevenser
 */

/**
 * Sjekk om den nåværende posisjonen matcher løsningen
 */
function checkSolution() {
    console.log(`🎯 === checkSolution() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    
    if (!currentProblem) {
        console.warn('⚠️  No current problem loaded');
        showFeedback('Ingen problem lastet!', 'error');
        return;
    }
    
    // Få spillhistorikk
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
    
    // Løsningen er alltid en liste med trekkstrenger: ["Nxe5"] eller ["e4", "exd5", "Qxd8#"]
    const solutionMoves = currentProblem.solution;
    console.log(`🧩 Problem ${currentProblem.id} solution moves:`, solutionMoves);
    
    let expectedMoveStr;
    let isCorrect = false;
    
    // Sjekk om vi er innenfor løsningssekvensen
    if (currentMoveIndex >= solutionMoves.length) {
        console.error(`❌ ERROR - Move index ${currentMoveIndex} exceeds solution length ${solutionMoves.length} for problem ${currentProblem.id}`);
        showFeedback('Sekvensen er allerede fullført!', 'error');
        return;
    }
    
    expectedMoveStr = solutionMoves[currentMoveIndex];
    console.log(`🎯 Expected move for problem ${currentProblem.id} at index ${currentMoveIndex}: ${expectedMoveStr}`);
    
    // Sjekk om spillerens trekk matcher det forventede trekket
    isCorrect = (playerMove === expectedMoveStr);
    
    console.log(`✅❌ Move validation result for problem ${currentProblem.id}: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    console.log(`   🎲 Player played: ${playerMove}`);
    console.log(`   🎯 Expected: ${expectedMoveStr}`);
    
    if (isCorrect) {
        console.log(`✅ === CORRECT MOVE in problem ${currentProblem.id} ===`);
        console.log(`   🎉 Move: ${playerMove}`);
        
        // Vis suksess-tilbakemelding med problemtittel/beskrivelse
        const feedbackText = currentProblem.description || 'Riktig trekk!';
        showFeedback(`Riktig! ${feedbackText}`, 'success');
        
        currentMoveIndex++;
        
        // Sjekk om sekvensen er komplett
        if (currentMoveIndex >= solutionMoves.length) {
            console.log(`🏆 === PROBLEM COMPLETE for ${currentProblem.id} ===`);
            console.log(`   💰 Points awarded: ${currentProblem.points}`);
            
            // Problem fullført
            playerScore += currentProblem.points;
            solvedProblems.push(currentProblem.id);
            
            showFeedback('Problem løst! Perfekt!', 'success');
            showSolution();
            updateScore();
            
            // Deaktiver sjekk løsning-knapp
            const checkBtn = document.getElementById('checkSolutionBtn');
            if (checkBtn) checkBtn.disabled = true;
            
            console.log(`   📊 Updated score: ${playerScore}`);
            console.log(`   📋 Solved problems: [${solvedProblems.join(', ')}]`);
        } else {
            // Mer av sekvensen gjenstår - simuler motstanderens respons hvis det finnes
            console.log(`🔄 Sequence continues - move ${currentMoveIndex + 1}/${solutionMoves.length}`);
            
            // For sekvensielle problemer, kan vi implementere automatisk motstanderrespons
            // Dette må utvides basert på problemtype
        }
    } else {
        console.log(`❌ === INCORRECT MOVE in problem ${currentProblem.id} ===`);
        console.log(`   🎲 Player played: ${playerMove}`);
        console.log(`   🎯 Expected: ${expectedMoveStr}`);
        
        showFeedback(`Feil! Forventet: ${expectedMoveStr}`, 'error');
    }
    
    console.log(`🎯 === checkSolution() END ===`);
}

/**
 * Vis et hint for det nåværende problemet
 */
function showHint() {
    console.log(`💡 === showHint() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    console.log(`   📊 Current hint index: ${currentHintIndex}`);
    
    if (!currentProblem) {
        console.warn('⚠️  No current problem - cannot show hint');
        showFeedback('Ingen problem lastet!', 'error');
        return;
    }
    
    // Sjekk om det finnes et hint
    if (currentProblem.hint) {
        console.log(`   💡 Showing hint for problem ${currentProblem.id}: "${currentProblem.hint}"`);
        showFeedback(currentProblem.hint, 'hint');
    } else {
        // Generer et generisk hint basert på løsningen
        const solutionMoves = currentProblem.solution;
        if (solutionMoves && solutionMoves.length > 0) {
            const firstMove = solutionMoves[0];
            const hintText = `Prøv: ${firstMove}`;
            console.log(`   💡 Generated hint for problem ${currentProblem.id}: "${hintText}"`);
            showFeedback(hintText, 'hint');
        } else {
            console.warn(`   ⚠️  No hint or solution available for problem ${currentProblem.id}`);
            showFeedback('Ingen hint tilgjengelig for dette problemet.', 'error');
        }
    }
    
    currentHintIndex++;
    console.log(`   📊 Hint index updated to: ${currentHintIndex}`);
    console.log(`💡 === showHint() END ===`);
}

/**
 * Tilbakestill til problemets startposisjon
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
    
    // Tilbakestill brettorientering for å matche problemet
    try {
        setBoardOrientation(currentProblem.toMove);
        console.log(`   ✅ Board orientation reset for problem ${currentProblem.id}`);
    } catch (error) {
        console.error(`   ❌ ERROR setting board orientation during reset:`, error);
    }
    
    hideFeedback();
    hideSolution();
    currentHintIndex = 0;
    currentMoveIndex = 0; // Tilbakestill trekksekvens
    isWaitingForOpponentMove = false; // Tilbakestill motstandertrekkflagg
    updateButtonStates();
    
    console.log(`   🎯 Reset complete for problem ${currentProblem.id}`);
    console.log(`🔄 === resetToStartingPosition() END ===`);
}

/**
 * Gjør et motstandertrekk automatisk
 * @param {string} moveNotation - Trekket i algebraisk notasjon (f.eks. "Kxf7")
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
            
            // Reaktiver knapper etter motstandertrekk
            setTimeout(() => {
                isWaitingForOpponentMove = false;
                toggleButtonsEnabled(true);
                hideFeedback(); // Fjern motstandertrekkmeldingen
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
 * Angre siste trekk (snapback-funksjonalitet)
 */
function undoLastMove() {
    const history = game.history();
    if (history.length > 0) {
        game.undo();
        board.position(game.fen());
        updateStatus();
        console.log('↩️  Last move undone');
    }
}

/**
 * Tilbakestill spillet til startposisjon
 */
function resetGame() {
    game.reset();
    board.start();
    updateStatus();
}
