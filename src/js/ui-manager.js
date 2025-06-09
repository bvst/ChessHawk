/**
 * ChessHawk - UI Manager
 * 
 * Håndterer brukergrensesnitt, tilbakemeldinger og visuelle elementer
 */

/**
 * Vis løsningen for det nåværende problemet
 */
function showSolution() {
    console.log(`📖 === showSolution() START ===`);
    console.log(`   🎯 Problem ID: ${currentProblem?.id || 'UNKNOWN'}`);
    
    if (!currentProblem) {
        console.warn('⚠️  No current problem - cannot show solution');
        showFeedback('Ingen problem lastet!', 'error');
        return;
    }
    
    const solutionElement = document.getElementById('solution');
    if (!solutionElement) {
        console.error('❌ Solution element not found in DOM');
        return;
    }
    
    console.log(`   🔍 Found solution element: ${solutionElement.id}`);
    console.log(`   📝 Processing solution for problem ${currentProblem.id}:`);
    console.log(`      Solution type: ${Array.isArray(currentProblem.solution) ? 'Array' : typeof currentProblem.solution}`);
    console.log(`      Solution content:`, currentProblem.solution);
    
    let solutionHtml = `<h4>Løsning for ${currentProblem.title}:</h4>`;
    
    // Håndter forskjellige løsningsformater
    if (typeof currentProblem.solution === 'string') {
        console.log(`   📝 Rendering string solution for problem ${currentProblem.id}: "${currentProblem.solution}"`);
        solutionHtml += `<p class="solution-move">${currentProblem.solution}</p>`;
    } else if (Array.isArray(currentProblem.solution)) {
        console.log(`   🔗 Rendering array solution for problem ${currentProblem.id}:`);
        
        // Enkel format - array av trekkstrenger
        if (typeof currentProblem.solution[0] === 'string') {
            currentProblem.solution.forEach((move, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                const movePrefix = isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`;
                
                console.log(`      ${index + 1}. ${movePrefix} ${move}`);
                solutionHtml += `<p><span class="solution-move">${movePrefix} ${move}</span></p>`;
            });
        } else if (Array.isArray(currentProblem.solution)) {
            console.log(`   🔗 Rendering complex object solution for problem ${currentProblem.id}:`);
            
            // Komplekst format - array av løsningsobjekter med forklaringer
            currentProblem.solution.forEach((sol, index) => {
                const moveNumber = Math.floor(index / 2) + 1;
                const isWhiteMove = index % 2 === 0;
                const movePrefix = isWhiteMove ? `${moveNumber}.` : `${moveNumber}...`;
                
                console.log(`      ${index + 1}. ${movePrefix} ${sol.move} - ${sol.explanation || 'Ingen forklaring'}`);
                
                solutionHtml += `<p><span class="solution-move">${movePrefix} ${sol.move}</span>`;
                if (sol.explanation) {
                    solutionHtml += ` - ${sol.explanation}`;
                }
                
                if (sol.opponentResponse) {
                    const oppMoveNumber = isWhiteMove ? moveNumber : moveNumber + 1;
                    const oppMovePrefix = isWhiteMove ? `${moveNumber}...` : `${oppMoveNumber}.`;
                    solutionHtml += `<br><span class="opponent-move">${oppMovePrefix} ${sol.opponentResponse}</span>`;
                    if (sol.opponentExplanation) {
                        solutionHtml += ` - ${sol.opponentExplanation}`;
                    }
                }
                solutionHtml += '</p>';
            });
        }
    } else {
        console.warn(`   ⚠️  Unknown solution format for problem ${currentProblem.id}:`, typeof currentProblem.solution);
        solutionHtml += `<p>Løsning: ${JSON.stringify(currentProblem.solution)}</p>`;
    }
    
    console.log(`   📝 Generated solution HTML (${solutionHtml.length} chars):`, solutionHtml.substring(0, 100) + '...');
    
    // Sett innholdet
    solutionElement.innerHTML = solutionHtml;
    
    // Vis løsningselementet
    console.log(`   🎨 Showing solution element...`);
    solutionElement.style.display = 'block';
    solutionElement.style.visibility = 'visible';
    solutionElement.classList.add('solution-visible');
    
    // Verifiser visning
    const computedStyle = window.getComputedStyle(solutionElement);
    console.log(`   ✅ Solution display verification:`);
    console.log(`      Style display: ${solutionElement.style.display}`);
    console.log(`      Computed display: ${computedStyle.display}`);
    console.log(`      Style visibility: ${solutionElement.style.visibility}`);
    console.log(`      Classes: ${solutionElement.className}`);
    
    console.log(`📖 === showSolution() END - Solution displayed for problem ${currentProblem.id} ===`);
}

/**
 * Skjul løsningsvisning
 */
function hideSolution() {
    const solutionElement = document.getElementById('solution');
    if (solutionElement) {
        solutionElement.style.display = 'none';
        solutionElement.classList.remove('solution-visible');
    }
}

/**
 * Vis tilbakemeldingsmelding
 * @param {string} message - Meldingen som skal vises
 * @param {string} type - Typen tilbakemelding (success, error, hint)
 */
function showFeedback(message, type = 'success') {
    console.log(`💬 === showFeedback() START ===`);
    console.log(`   📝 Message: "${message}"`);
    console.log(`   🎨 Type: ${type}`);
    
    const feedbackElement = document.getElementById('feedback');
    if (!feedbackElement) {
        console.error('❌ Feedback element not found');
        return;
    }
    
    // Sett innhold og stil
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback ${type}`;
    feedbackElement.style.display = 'block';
    
    console.log(`   ✅ Feedback displayed successfully`);
    console.log(`   🎨 Element display style: ${feedbackElement.style.display}`);
    console.log(`   🎨 Element classes: ${feedbackElement.className}`);
}

/**
 * Skjul tilbakemeldingsvisning
 */
function hideFeedback() {
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}

/**
 * Oppdater knapptilstander basert på nåværende spilltilstand
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
 * Oppdater poengsumvisning
 */
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Total poeng: ${playerScore}`;
    }
}

/**
 * Veksle knapp aktivert/deaktivert tilstand
 * @param {boolean} enabled - Om knapper skal være aktivert
 */
function toggleButtonsEnabled(enabled) {
    console.log(`🔘 === toggleButtonsEnabled(${enabled}) START ===`);
    
    const buttons = [
        { id: 'checkSolutionBtn', name: 'Check Solution' },
        { id: 'getHintBtn', name: 'Get Hint' },
        { id: 'resetPositionBtn', name: 'Reset Position' },
        { id: 'newProblemBtn', name: 'New Problem' }
    ];
    
    buttons.forEach(({ id, name }) => {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = !enabled;
            console.log(`   ${enabled ? '✅' : '🔒'} ${name} button: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        } else {
            console.warn(`   ⚠️  ${name} button not found in DOM`);
        }
    });
}

// Rask testfunksjon for debugging
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
