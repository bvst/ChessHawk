/**
 * ChessHawk - Problem Manager
 * 
 * Håndterer problemlasting, tilfeldig valg og problemvisning
 * TypeScript version with proper type safety
 */

import type { Puzzle } from '../types/puzzle.types';
import type { IProblemManager } from '../types/chess.types';

/**
 * ProblemManager klasse for håndtering av problemer
 */
class ProblemManager implements IProblemManager {
    problems: Puzzle[] = [];
    currentProblem: Puzzle | null = null;
    // #currentProblemIndex: number = -1;
    #abortController: AbortController | null = null;

    constructor() {
        console.log('🏗️ ProblemManager initialized');
    }

    /**
     * Update problems loaded status
     */
    #updateProblemsLoadedStatus(count: number, error: string | null = null): void {
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
     * Load problems from JSON file
     */
    async loadProblems(): Promise<Puzzle[]> {
        console.log('📂 === LOADING PROBLEMS ===');
        
        try {
            console.log('   🔍 Attempting to fetch problems.json...');
            
            this.#abortController?.abort();
            this.#abortController = new AbortController();
            
            const pathsToTry = [
                'src/data/problems.json',
                './src/data/problems.json', 
                '../src/data/problems.json',
                'data/problems.json',
                './data/problems.json'
            ];
            
            let response: Response | null = null;
            // let jsonPath = '';
            
            for (const path of pathsToTry) {
                try {
                    console.log(`   📂 Trying path: ${path}`);
                    response = await fetch(path, { 
                        signal: this.#abortController.signal,
                        cache: 'no-cache'
                    });
                    
                    if (response.ok) {
                        // jsonPath = path;
                        console.log(`   ✅ Success with path: ${path}`);
                        break;
                    } else {
                        console.log(`   ❌ Failed with status ${response.status}: ${path}`);
                    }
                } catch (fetchError: any) {
                    console.log(`   ❌ Fetch error for ${path}:`, fetchError.message);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Could not load problems.json from any path. Tried: ${pathsToTry.join(', ')}`);
            }
            
            const data = await response.json();
            console.log(`   📊 Data loaded:`, {
                version: data.version,
                totalPuzzles: data.totalPuzzles,
                themes: data.themes?.length || 0,
                puzzles: data.puzzles?.length || 0,
                problems: data.problems?.length || 0
            });
            
            const problemsArray = data.puzzles || data.problems;
            if (!problemsArray || !Array.isArray(problemsArray)) {
                throw new Error('Invalid data format: puzzles/problems array not found');
            }
            
            this.problems = problemsArray;
            console.log(`   ✅ Loaded ${this.problems.length} problems successfully`);
            
            this.#updateProblemsLoadedStatus(this.problems.length);
            
            return this.problems;
            
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('   ⏹️ Request was aborted');
                return [];
            }
            
            console.error('   ❌ Error loading problems:', error);
            console.log('   🔧 Attempting to use fallback data...');
            
            const fallbackData = this.#createFallbackData();
            if (fallbackData) {
                console.log('   ✅ Using fallback data');
                this.problems = fallbackData;
                this.#updateProblemsLoadedStatus(this.problems.length);
                return this.problems;
            }
            
            this.#updateProblemsLoadedStatus(0, error.message);
            throw error;
        }
    }

    /**
     * Get random problem
     */
    getRandomProblem(): Puzzle | null {
        console.log('🎲 === GET RANDOM PROBLEM ===');
        
        if (!this.problems || this.problems.length === 0) {
            console.error('   ❌ No problems loaded');
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * this.problems.length);
        const problem = this.problems[randomIndex];
        
        if (!problem) {
            console.error('❌ No problem found at random index');
            return null;
        }
        
        console.log(`   🎯 Selected problem ${randomIndex + 1}/${this.problems.length}:`, {
            id: problem.id,
            title: problem.title,
            theme: problem.theme,
            difficulty: problem.difficulty,
            rating: problem.rating
        });
        
        this.currentProblem = problem;
        // this.#currentProblemIndex = randomIndex;
        
        (window as any).currentProblem = problem;
        
        return problem;
    }

    /**
     * Display problem
     */
    displayProblem(problem: Puzzle): void {
        if (!problem) {
            console.error('❌ No problem to display');
            return;
        }
        
        console.log('🖥️ === DISPLAYING PROBLEM ===');
        console.log(`   📋 Problem: ${problem.title}`);
        console.log(`   📂 Theme: ${problem.theme}`);
        console.log(`   ⭐ Difficulty: ${problem.difficulty}`);
        console.log(`   📊 Rating: ${problem.rating}`);
        console.log(`   💎 Points: ${problem.points}`);
        console.log(`   🎯 FEN: ${problem.fen}`);
        
        this.#updateProblemUI(problem);
    }

    /**
     * Create fallback data for testing
     */
    #createFallbackData(): Puzzle[] | null {
        try {
            return [
                {
                    id: "fallback_1",
                    theme: "fork" as const,
                    title: "Test Problem - Fork",
                    description: "Find the fork that wins material",
                    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    solution: ["e4", "e5", "Nf3"] as const,
                    hint: "Look for a knight move that attacks two pieces",
                    difficulty: "beginner" as const,
                    tags: ["fork", "beginner", "opening"] as const,
                    points: 10,
                    rating: 1200,
                    source: "Curated" as const,
                    lichessUrl: "https://lichess.org/training/fallback_1",
                    createdAt: new Date().toISOString()
                },
                {
                    id: "fallback_2",
                    theme: "pin" as const,
                    title: "Test Problem - Pin",
                    description: "Find the pin that wins the queen",
                    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
                    solution: ["Bc4", "Nf6", "Ng5"] as const,
                    hint: "Pin the knight to attack f7",
                    difficulty: "intermediate" as const,
                    tags: ["pin", "intermediate", "opening"] as const,
                    points: 15,
                    rating: 1400,
                    source: "Curated" as const,
                    lichessUrl: "https://lichess.org/training/fallback_2",
                    createdAt: new Date().toISOString()
                }
            ];
        } catch (error) {
            console.error('Could not create fallback data:', error);
            return null;
        }
    }

    /**
     * Update problem UI
     */
    #updateProblemUI(problem: Puzzle): void {
        const elements = {
            title: document.getElementById('problem-title') || document.getElementById('problemTitle'),
            description: document.getElementById('problem-description') || document.getElementById('problemDescription'),
            category: document.getElementById('category'),
            difficulty: document.getElementById('difficulty') || document.getElementById('problemDifficulty'),
            rating: document.getElementById('rating'),
            points: document.getElementById('points') || document.getElementById('problemPoints')
        };
        
        if (elements.title) elements.title.textContent = problem.title || 'Ukjent problem';
        if (elements.description) elements.description.textContent = problem.description || '';
        if (elements.category) elements.category.textContent = problem.theme || 'Ukjent';
        if (elements.difficulty) elements.difficulty.textContent = problem.difficulty || 'Ukjent';
        if (elements.rating) elements.rating.textContent = problem.rating?.toString() || 'N/A';
        if (elements.points) elements.points.textContent = problem.points?.toString() || '0';
        
        const metaElement = document.getElementById('problem-meta');
        if (metaElement) {
            const category = problem.theme || 'ukjent';
            metaElement.innerHTML = `
                <span class="category-badge ${category}">${category}</span>
                <span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span>
                <span class="rating-badge">Rating: ${problem.rating}</span>
                <span class="points-badge">💎 ${problem.points} poeng</span>
            `;
        }
        
        console.log('   ✅ UI updated successfully');
    }

    /**
     * Get statistics
     */
    getStatistics(): any {
        if (!this.problems || this.problems.length === 0) {
            return null;
        }

        const stats = {
            total: this.problems.length,
            categories: {} as Record<string, number>,
            difficulties: {} as Record<string, number>,
            ratings: {
                min: Math.min(...this.problems.map(p => p.rating)),
                max: Math.max(...this.problems.map(p => p.rating)),
                avg: Math.round(this.problems.reduce((sum, p) => sum + p.rating, 0) / this.problems.length)
            }
        };

        this.problems.forEach(problem => {
            const cat = problem.theme || 'unknown';
            const diff = problem.difficulty || 'unknown';
            stats.categories[cat] = (stats.categories[cat] || 0) + 1;
            stats.difficulties[diff] = (stats.difficulties[diff] || 0) + 1;
        });

        return stats;
    }

    /**
     * Get problem count
     */
    get problemCount(): number {
        return this.problems?.length || 0;
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        this.#abortController?.abort();
        this.problems = [];
        this.currentProblem = null;
        // this.#currentProblemIndex = -1;
        (window as any).currentProblem = null;
    }
}

export default ProblemManager;

// Create and export a singleton instance for backward compatibility
export const problemManager = new ProblemManager();

// Expose to global scope for compatibility
(window as any).ProblemManager = ProblemManager;
(window as any).problemManager = problemManager;