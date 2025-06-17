/**
 * ChessHawk Lichess Importer - TypeScript Version
 * Importerer sjakk-taktikkproblemer fra Lichess API
 */

interface LichessPuzzleData {
  puzzles: LichessPuzzle[];
}

interface LichessPuzzle {
  puzzle: {
    id: string;
    solution: string[];
    themes: string[];
    rating: number;
  };
  game: {
    pgn: string;
    clock?: string;
  };
}

interface SolutionStep {
  move: string;
  explanation: string;
  opponentResponse?: string;
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Category = 'fork' | 'pin' | 'skewer' | 'discovered_attack' | 'deflection' | 'decoy' | 'mate' | 'sacrifice' | 'opening' | 'middlegame' | 'endgame' | 'general';

export class LichessImporter {
  private readonly baseUrl = 'https://lichess.org/api/puzzle/batch';

  /**
   * Importer problemer fra Lichess API
   * @param count - Antall problemer å hente (standard: 50)
   * @param theme - Tematisk filter (fork, pin, skewer, etc.)
   */
  async importPuzzles(count = 50, theme: string | null = null): Promise<LichessPuzzle[]> {
    console.log(`🌐 === Importing ${count} puzzles from Lichess ===`);
    
    try {
      let url = `${this.baseUrl}?nb=${count}`;
      
      if (theme) {
        url += `&themes=${theme}`;
      }
      
      console.log(`📡 Fetching from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: LichessPuzzleData = await response.json();
      console.log(`✅ Received ${data.puzzles?.length || 0} puzzles from Lichess`);
      
      if (data.puzzles && data.puzzles.length > 0) {
        return data.puzzles;
      } else {
        console.warn('⚠️ No puzzles received from Lichess');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error importing from Lichess:', error);
      throw error;
    }
  }

  /**
   * Konverter Lichess løsning til vårt format
   * @param moves - Array av trekk fra Lichess
   */
  convertSolution(moves: string[]): SolutionStep[] {
    const solution: SolutionStep[] = [];
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const explanation = i === 0 ? "Første trekk i løsningen" : `Fortsettelse av kombinasjonen`;
      
      const step: SolutionStep = {
        move: move,
        explanation: explanation
      };
      
      // Legg til motstanderens svar hvis det finnes
      if (i + 1 < moves.length) {
        const opponentMove = moves[i + 1];
        step.opponentResponse = opponentMove;
        i++; // Skip neste siden vi tok den som opponent response
      }
      
      solution.push(step);
    }
    
    return solution;
  }

  /**
   * Map Lichess rating til vårt difficulty system
   */
  mapRatingToDifficulty(rating: number): Difficulty {
    if (rating < 1200) return 'beginner';
    if (rating < 1600) return 'intermediate';
    if (rating < 2000) return 'advanced';
    return 'expert';
  }

  /**
   * Map Lichess themes til våre kategorier
   */
  mapThemeToCategory(theme: string): Category {
    const themeMapping: Record<string, Category> = {
      'fork': 'fork',
      'pin': 'pin',
      'skewer': 'skewer',
      'discoveredAttack': 'discovered_attack',
      'deflection': 'deflection',
      'decoy': 'decoy',
      'mate': 'mate',
      'mateIn1': 'mate',
      'mateIn2': 'mate',
      'mateIn3': 'mate',
      'sacrifice': 'sacrifice',
      'opening': 'opening',
      'middlegame': 'middlegame',
      'endgame': 'endgame'
    };
    
    return themeMapping[theme] || 'general';
  }

  /**
   * Get Norwegian theme name
   */
  getNorwegianThemeName(theme: string): string {
    const norwegianNames: Record<string, string> = {
      'fork': 'Gaffel',
      'pin': 'Binding',
      'skewer': 'Spett',
      'discoveredAttack': 'Oppdekking',
      'deflection': 'Avledning',
      'decoy': 'Lokking',
      'mate': 'Sjakkmatt',
      'mateIn1': 'Matt i ett',
      'mateIn2': 'Matt i to',
      'mateIn3': 'Matt i tre',
      'sacrifice': 'Offer',
      'opening': 'Åpning',
      'middlegame': 'Midtspill',
      'endgame': 'Sluttspill'
    };
    
    return norwegianNames[theme] || theme;
  }

  /**
   * Validate puzzle data before conversion
   */
  validatePuzzle(puzzle: LichessPuzzle): string[] {
    const errors: string[] = [];
    
    if (!puzzle.puzzle?.id) {
      errors.push('Missing puzzle ID');
    }
    
    if (!puzzle.puzzle?.solution || !Array.isArray(puzzle.puzzle.solution) || puzzle.puzzle.solution.length === 0) {
      errors.push('Invalid or missing solution');
    }
    
    if (!puzzle.puzzle?.rating || typeof puzzle.puzzle.rating !== 'number') {
      errors.push('Invalid or missing rating');
    }
    
    if (!puzzle.puzzle?.themes || !Array.isArray(puzzle.puzzle.themes) || puzzle.puzzle.themes.length === 0) {
      errors.push('Invalid or missing themes');
    }
    
    if (!puzzle.game?.pgn) {
      errors.push('Missing game PGN');
    }
    
    return errors;
  }
}

// Export for both browser and Node.js environments
export type { LichessPuzzle, LichessPuzzleData, SolutionStep, Difficulty, Category };

// Browser compatibility
if (typeof window !== 'undefined') {
  (window as any).LichessImporter = LichessImporter;
}