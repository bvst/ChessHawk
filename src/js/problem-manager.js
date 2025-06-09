/**
 * ChessHawk - Problem Manager
 * 
 * Håndterer problemlasting, tilfeldig valg og problemvisning
 * Modernized with ES2024+ features and ES6 modules
 */

/**
 * ProblemManager klasse for håndtering av problemer
 */
class ProblemManager {
    #problems = [];
    #currentProblem = null;
    #currentProblemIndex = -1;
    #abortController = null;

    constructor() {
        console.log('🏗️ ProblemManager initialized');
    }

    /**
     * Last problemer fra JSON-fil
     */
    async loadProblems() {
        console.log('📂 === LOADING PROBLEMS ===');
        
        try {
            console.log('   🔍 Attempting to fetch problems.json...');
            
            // Avbryt tidligere requests hvis de finnes
            this.#abortController?.abort();
            this.#abortController = new AbortController();
            
            // Prøv først hovedstien
            let jsonPath = 'src/data/problems.json';
            console.log(`   📂 Trying primary path: ${jsonPath}`);
            let response = await fetch(jsonPath, { 
                signal: this.#abortController.signal 
            });
            
            // Hvis det feiler, prøv alternativ sti
            if (!response.ok) {
                jsonPath = '../src/data/problems.json';
                console.log(`   📂 Trying alternative path: ${jsonPath}`);
                response = await fetch(jsonPath, { 
                    signal: this.#abortController.signal 
                });
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(`   ✅ Fetch successful (status: ${response.status})`);
            
            const data = await response.json();
            console.log(`   📊 Data loaded:`, {
                version: data.version,
                totalPuzzles: data.totalPuzzles,
                themes: data.themes?.length || 0,
                problems: data.problems?.length || 0
            });
            
            // Valider data struktur
            if (!data.problems || !Array.isArray(data.problems)) {
                throw new Error('Invalid data format: problems array not found');
            }
            
            this.#problems = data.problems;
            console.log(`   ✅ Loaded ${this.#problems.length} problems successfully`);
            
            // Oppdater UI med status
            this.#updateProblemsLoadedStatus(this.#problems.length);
            
            return this.#problems;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('   ⏹️ Request was aborted');
                return null;
            }
            
            console.error('   ❌ Error loading problems:', error);
            this.#updateProblemsLoadedStatus(0, error.message);
            throw error;
        }
    }

    /**
     * Få tilfeldig problem
     */
    getRandomProblem() {
        console.log('🎲 === GET RANDOM PROBLEM ===');
        
        if (!this.#problems || this.#problems.length === 0) {
            console.error('   ❌ No problems loaded');
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * this.#problems.length);
        const problem = this.#problems[randomIndex];
        
        console.log(`   🎯 Selected problem ${randomIndex + 1}/${this.#problems.length}:`, {
            id: problem.id,
            title: problem.title,
            category: problem.category,
            difficulty: problem.difficulty,
            rating: problem.rating
        });
        
        this.#currentProblem = problem;
        this.#currentProblemIndex = randomIndex;
        
        // Eksponer til global scope for bakoverkompatibilitet
        window.currentProblem = problem;
        
        return problem;
    }

    /**
     * Få neste problem i sekvens
     */
    getNextProblem() {
        if (!this.#problems || this.#problems.length === 0) {
            console.error('❌ No problems loaded');
            return null;
        }
        
        this.#currentProblemIndex = (this.#currentProblemIndex + 1) % this.#problems.length;
        this.#currentProblem = this.#problems[this.#currentProblemIndex];
        
        console.log(`➡️ Next problem: ${this.#currentProblemIndex + 1}/${this.#problems.length}`);
        
        // Eksponer til global scope
        window.currentProblem = this.#currentProblem;
        
        return this.#currentProblem;
    }

    /**
     * Få forrige problem i sekvens
     */
    getPreviousProblem() {
        if (!this.#problems || this.#problems.length === 0) {
            console.error('❌ No problems loaded');
            return null;
        }
        
        this.#currentProblemIndex = (this.#currentProblemIndex - 1 + this.#problems.length) % this.#problems.length;
        this.#currentProblem = this.#problems[this.#currentProblemIndex];
        
        console.log(`⬅️ Previous problem: ${this.#currentProblemIndex + 1}/${this.#problems.length}`);
        
        // Eksponer til global scope
        window.currentProblem = this.#currentProblem;
        
        return this.#currentProblem;
    }

    /**
     * Få problem etter filter
     */
    getFilteredProblems(filter = {}) {
        if (!this.#problems || this.#problems.length === 0) {
            return [];
        }

        return this.#problems.filter(problem => {
            // Filter etter kategori
            if (filter.category && problem.category !== filter.category) {
                return false;
            }
            
            // Filter etter vanskelighetsgrad
            if (filter.difficulty && problem.difficulty !== filter.difficulty) {
                return false;
            }
            
            // Filter etter rating range
            if (filter.minRating && problem.rating < filter.minRating) {
                return false;
            }
            
            if (filter.maxRating && problem.rating > filter.maxRating) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Vis probleminfo
     */
    displayProblem(problem) {
        if (!problem) {
            console.error('❌ No problem to display');
            return;
        }
        
        console.log('🖥️ === DISPLAYING PROBLEM ===');
        console.log(`   📋 Problem: ${problem.title}`);
        console.log(`   📂 Category: ${problem.category}`);
        console.log(`   ⭐ Difficulty: ${problem.difficulty}`);
        console.log(`   📊 Rating: ${problem.rating}`);
        console.log(`   💎 Points: ${problem.points}`);
        console.log(`   🎯 FEN: ${problem.fen}`);
        
        // Oppdater UI elementer med moderne DOM metoder
        this.#updateProblemUI(problem);
    }

    /**
     * Privat metode for å oppdatere problem UI
     */
    #updateProblemUI(problem) {
        // Bruk moderne optional chaining og nullish coalescing
        const elements = {
            title: document.getElementById('problem-title'),
            description: document.getElementById('problem-description'),
            category: document.getElementById('category'),
            difficulty: document.getElementById('difficulty'),
            rating: document.getElementById('rating'),
            points: document.getElementById('points')
        };
        
        // Oppdater elementer hvis de finnes
        elements.title?.textContent = problem.title || 'Ukjent problem';
        elements.description?.textContent = problem.description || '';
        elements.category?.textContent = problem.category || 'Ukjent';
        elements.difficulty?.textContent = problem.difficulty || 'Ukjent';
        elements.rating?.textContent = problem.rating?.toString() || 'N/A';
        elements.points?.textContent = problem.points?.toString() || '0';
        
        // Oppdater meta info
        const metaElement = document.getElementById('problem-meta');
        if (metaElement) {
            metaElement.innerHTML = `
                <span class="category-badge ${problem.category}">${problem.category}</span>
                <span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span>
                <span class="rating-badge">Rating: ${problem.rating}</span>
                <span class="points-badge">💎 ${problem.points} poeng</span>
            `;
        }
        
        console.log('   ✅ UI updated successfully');
    }

    /**
     * Privat metode for å oppdatere problem loading status
     */
    #updateProblemsLoadedStatus(count, error = null) {
        const statusElement = document.getElementById('problems-status');
        if (statusElement) {
            if (error) {
                statusElement.textContent = `❌ Feil ved lasting: ${error}`;
                statusElement.className = 'status-error';
            } else if (count > 0) {
                statusElement.textContent = `✅ ${count} problemer lastet`;
                statusElement.className = 'status-success';
            } else {
                statusElement.textContent = '⏳ Laster problemer...';
                statusElement.className = 'status-loading';
            }
        }
    }

    /**
     * Getter for problemer
     */
    get problems() {
        return this.#problems;
    }

    /**
     * Getter for nåværende problem
     */
    get currentProblem() {
        return this.#currentProblem;
    }

    /**
     * Getter for antall problemer
     */
    get problemCount() {
        return this.#problems?.length || 0;
    }

    /**
     * Få statistikk om problemer
     */
    getStatistics() {
        if (!this.#problems || this.#problems.length === 0) {
            return null;
        }

        const stats = {
            total: this.#problems.length,
            categories: {},
            difficulties: {},
            ratings: {
                min: Math.min(...this.#problems.map(p => p.rating)),
                max: Math.max(...this.#problems.map(p => p.rating)),
                avg: Math.round(this.#problems.reduce((sum, p) => sum + p.rating, 0) / this.#problems.length)
            }
        };

        // Tell kategorier og vanskelighetsgrader
        this.#problems.forEach(problem => {
            stats.categories[problem.category] = (stats.categories[problem.category] || 0) + 1;
            stats.difficulties[problem.difficulty] = (stats.difficulties[problem.difficulty] || 0) + 1;
        });

        return stats;
    }

    /**
     * Cleanup metode
     */
    destroy() {
        this.#abortController?.abort();
        this.#problems = [];
        this.#currentProblem = null;
        this.#currentProblemIndex = -1;
        window.currentProblem = null;
    }
}

// Export the class as default
export default ProblemManager;

// Also create and export a singleton instance for backward compatibility
export const problemManager = new ProblemManager();

// Expose to global scope for compatibility with existing code
window.ProblemManager = ProblemManager;
window.problemManager = problemManager;
