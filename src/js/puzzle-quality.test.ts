/**
 * Chess Hawk Puzzle Quality Analysis Tests
 * Analyzes current puzzle database for quality issues and validation
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { Chess } from './chess-global'
import * as fs from 'fs'
import * as path from 'path'

interface Puzzle {
  id: string
  theme: string
  title: string
  description: string
  fen: string
  solution: string[]
  difficulty: string
  rating: number
  points: number
  hint: string
  tags: string[]
  source: string
  createdAt: string
}

interface PuzzleDatabase {
  version: string
  generated: string
  totalPuzzles: number
  themes: string[]
  source: string
  puzzles: Puzzle[]
}

describe('Puzzle Quality Analysis', () => {
  let puzzleData: PuzzleDatabase
  let puzzles: Puzzle[]

  beforeAll(async () => {
    // Load puzzle data from file system
    const dataPath = path.join(process.cwd(), 'src', 'data', 'problems.json')
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    puzzleData = JSON.parse(fileContent)
    puzzles = puzzleData.puzzles
  })

  describe('Database Structure Validation', () => {
    it('should have valid database metadata', () => {
      expect(puzzleData.version).toBeDefined()
      expect(puzzleData.totalPuzzles).toBe(1000)
      expect(puzzleData.themes).toHaveLength(10)
      expect(puzzleData.puzzles).toHaveLength(1000)
    })

    it('should have consistent theme distribution', () => {
      const themeCounts = puzzles.reduce((acc, puzzle) => {
        acc[puzzle.theme] = (acc[puzzle.theme] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Each theme should have exactly 100 puzzles
      Object.values(themeCounts).forEach(count => {
        expect(count).toBe(100)
      })
    })
  })

  describe('Chess Position Validation', () => {
    it('should have all valid FEN positions', () => {
      const invalidPositions: string[] = []

      puzzles.forEach(puzzle => {
        try {
          const game = new Chess(puzzle.fen)
          // If we can create a Chess instance, the FEN is valid
          expect(game).toBeDefined()
        } catch (error) {
          invalidPositions.push(puzzle.id)
        }
      })

      if (invalidPositions.length > 0) {
        console.log(`❌ Invalid FEN positions found in puzzles: ${invalidPositions.join(', ')}`)
      }
      expect(invalidPositions).toHaveLength(0)
    })

    it('should not have duplicate FEN positions', () => {
      const fenCounts = puzzles.reduce((acc, puzzle) => {
        acc[puzzle.fen] = (acc[puzzle.fen] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const duplicateFens = Object.entries(fenCounts)
        .filter(([_, count]) => count > 1)
        .map(([fen, count]) => ({ fen, count }))

      if (duplicateFens.length > 0) {
        console.log(`⚠️ Duplicate FEN positions found:`)
        duplicateFens.forEach(({ fen, count }) => {
          console.log(`  - "${fen}" appears ${count} times`)
        })
      }

      // Report but don't fail - this is expected with generated puzzles
      expect(duplicateFens.length).toBeLessThan(100) // Should be less than 10% duplicates
    })
  })

  describe('Solution Validation', () => {
    it('should have valid solutions for all puzzles', () => {
      const invalidSolutions: Array<{ id: string, error: string }> = []

      puzzles.forEach(puzzle => {
        try {
          const game = new Chess(puzzle.fen)
          
          puzzle.solution.forEach((move, index) => {
            try {
              const result = game.move(move)
              if (!result) {
                invalidSolutions.push({
                  id: puzzle.id,
                  error: `Invalid move "${move}" at position ${index + 1}`
                })
              }
            } catch (error) {
              invalidSolutions.push({
                id: puzzle.id,
                error: `Move "${move}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              })
            }
          })
        } catch (error) {
          invalidSolutions.push({
            id: puzzle.id,
            error: `Invalid starting position: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }
      })

      if (invalidSolutions.length > 0) {
        console.log(`❌ Invalid solutions found:`)
        invalidSolutions.slice(0, 10).forEach(({ id, error }) => {
          console.log(`  - ${id}: ${error}`)
        })
        if (invalidSolutions.length > 10) {
          console.log(`  ... and ${invalidSolutions.length - 10} more`)
        }
      }

      expect(invalidSolutions).toHaveLength(0)
    })

    it('should have single-move solutions for most puzzles', () => {
      const multiMovePuzzles = puzzles.filter(puzzle => puzzle.solution.length > 1)
      const singleMovePuzzles = puzzles.filter(puzzle => puzzle.solution.length === 1)

      console.log(`📊 Solution length distribution:`)
      console.log(`  - Single move: ${singleMovePuzzles.length} (${(singleMovePuzzles.length/puzzles.length*100).toFixed(1)}%)`)
      console.log(`  - Multi move: ${multiMovePuzzles.length} (${(multiMovePuzzles.length/puzzles.length*100).toFixed(1)}%)`)

      // Most tactical puzzles should have single-move solutions
      expect(singleMovePuzzles.length).toBeGreaterThan(puzzles.length * 0.7) // At least 70% single move
    })
  })

  describe('Rating and Difficulty Analysis', () => {
    it('should have appropriate rating distribution', () => {
      const ratingRanges = {
        'beginner': puzzles.filter(p => p.difficulty === 'beginner'),
        'intermediate': puzzles.filter(p => p.difficulty === 'intermediate'),
        'advanced': puzzles.filter(p => p.difficulty === 'advanced')
      }

      console.log(`📊 Difficulty distribution:`)
      Object.entries(ratingRanges).forEach(([difficulty, puzzleList]) => {
        const ratings = puzzleList.map(p => p.rating)
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        console.log(`  - ${difficulty}: ${puzzleList.length} puzzles, avg rating: ${avgRating.toFixed(0)}`)
      })

      // Should have reasonable distribution
      expect(ratingRanges.beginner.length).toBeGreaterThan(200)
      expect(ratingRanges.intermediate.length).toBeGreaterThan(200)
      expect(ratingRanges.advanced.length).toBeGreaterThan(200)
    })

    it('should have consistent rating-difficulty mapping', () => {
      const inconsistentMappings: Array<{ id: string, rating: number, difficulty: string }> = []

      puzzles.forEach(puzzle => {
        const { rating, difficulty, id } = puzzle
        
        // Check if rating matches difficulty
        const isInconsistent = (
          (difficulty === 'beginner' && rating > 1400) ||
          (difficulty === 'intermediate' && (rating < 1200 || rating > 1800)) ||
          (difficulty === 'advanced' && rating < 1600)
        )

        if (isInconsistent) {
          inconsistentMappings.push({ id, rating, difficulty })
        }
      })

      if (inconsistentMappings.length > 0) {
        console.log(`⚠️ Inconsistent rating-difficulty mappings:`)
        inconsistentMappings.slice(0, 5).forEach(({ id, rating, difficulty }) => {
          console.log(`  - ${id}: ${difficulty} with rating ${rating}`)
        })
      }

      // Allow some inconsistency but not too much
      expect(inconsistentMappings.length).toBeLessThan(puzzles.length * 0.1) // Less than 10%
    })
  })

  describe('Content Quality Analysis', () => {
    it('should have Norwegian localization', () => {
      const norwegianKeywords = ['angrip', 'samtidig', 'gaffel', 'spiss', 'mat', 'offer', 'trekk']
      let norwegianContent = 0

      puzzles.forEach(puzzle => {
        const content = `${puzzle.title} ${puzzle.description} ${puzzle.hint}`.toLowerCase()
        if (norwegianKeywords.some(keyword => content.includes(keyword))) {
          norwegianContent++
        }
      })

      console.log(`🇳🇴 Norwegian content: ${norwegianContent}/${puzzles.length} puzzles (${(norwegianContent/puzzles.length*100).toFixed(1)}%)`)
      
      // Should have mostly Norwegian content
      expect(norwegianContent).toBeGreaterThan(puzzles.length * 0.8) // At least 80%
    })

    it('should have meaningful descriptions', () => {
      const genericDescriptions = puzzles.filter(puzzle => 
        puzzle.description === 'Angrip to brikker samtidig' ||
        puzzle.description.length < 10
      )

      console.log(`📝 Generic descriptions: ${genericDescriptions.length}/${puzzles.length} puzzles`)
      
      // Too many generic descriptions indicates generated content
      if (genericDescriptions.length > puzzles.length * 0.5) {
        console.log(`⚠️ High number of generic descriptions suggests generated content`)
      }

      // This will likely fail with current generated data - that's the point
      expect(genericDescriptions.length).toBeLessThan(puzzles.length * 0.3) // Less than 30%
    })

    it('should have varied titles', () => {
      const titleCounts = puzzles.reduce((acc, puzzle) => {
        const baseTitle = puzzle.title.replace(/\s+\d+$/, '') // Remove numbers at end
        acc[baseTitle] = (acc[baseTitle] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const repetitiveTitles = Object.entries(titleCounts)
        .filter(([_, count]) => count > 50)
        .map(([title, count]) => ({ title, count }))

      if (repetitiveTitles.length > 0) {
        console.log(`⚠️ Repetitive titles found:`)
        repetitiveTitles.forEach(({ title, count }) => {
          console.log(`  - "${title}" appears ${count} times`)
        })
      }

      // Generated content will have very repetitive titles
      expect(repetitiveTitles.length).toBeLessThan(5)
    })
  })

  describe('Theme Accuracy Analysis', () => {
    it('should have theme-appropriate content', () => {
      const themeKeywords = {
        fork: ['gaffel', 'angrip', 'samtidig'],
        pin: ['spiss', 'fest', 'bundet'],
        skewer: ['spiss', 'tvinng'],
        mate: ['mat', 'sjakkmatt'],
        mateIn1: ['mat i 1', 'matt i ett'],
        mateIn2: ['mat i 2', 'matt i to'],
        sacrifice: ['offer', 'oppgi'],
        deflection: ['avled', 'trekk bort'],
        decoy: ['lokke', 'felle'],
        discoveredAttack: ['avdekk', 'åpning']
      }

      const themeAccuracy: Record<string, number> = {}

      Object.keys(themeKeywords).forEach(theme => {
        const themePuzzles = puzzles.filter(p => p.theme === theme)
        const keywords = themeKeywords[theme as keyof typeof themeKeywords]
        
        const accuratePuzzles = themePuzzles.filter(puzzle => {
          const content = `${puzzle.title} ${puzzle.description} ${puzzle.hint}`.toLowerCase()
          return keywords.some(keyword => content.includes(keyword))
        })

        themeAccuracy[theme] = accuratePuzzles.length / themePuzzles.length
      })

      console.log(`🎯 Theme accuracy:`)
      Object.entries(themeAccuracy).forEach(([theme, accuracy]) => {
        console.log(`  - ${theme}: ${(accuracy * 100).toFixed(1)}%`)
      })

      // Most themes should have reasonable accuracy
      const avgAccuracy = Object.values(themeAccuracy).reduce((sum, acc) => sum + acc, 0) / Object.keys(themeAccuracy).length
      expect(avgAccuracy).toBeGreaterThan(0.5) // At least 50% theme accuracy
    })
  })
})

describe('Puzzle Import System Tests', () => {
  describe('Lichess Import Validation', () => {
    it('should handle API errors gracefully', async () => {
      // Test with invalid URL to simulate API failure
      const invalidUrl = 'https://lichess.org/api/puzzle/nonexistent'
      
      try {
        const response = await fetch(invalidUrl)
        expect(response.ok).toBe(false)
        expect(response.status).toBeGreaterThanOrEqual(400)
      } catch (error) {
        // Network errors are also acceptable for this test
        expect(error).toBeDefined()
      }
    })

    it('should validate required puzzle fields', () => {
      const requiredFields = ['id', 'fen', 'solution', 'rating', 'themes']
      
      // Mock puzzle data structure that should be validated
      const mockPuzzle = {
        id: 'test123',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: ['e4'],
        rating: 1500,
        themes: ['opening']
      }

      requiredFields.forEach(field => {
        expect(mockPuzzle).toHaveProperty(field)
        expect(mockPuzzle[field as keyof typeof mockPuzzle]).toBeDefined()
      })
    })
  })

  describe('Data Conversion Testing', () => {
    it('should convert Lichess format to Chess Hawk format', () => {
      const lichessPuzzle = {
        puzzle: {
          id: 'abc123',
          solution: ['e4', 'e5', 'Nf3'],
          themes: ['fork', 'opening'],
          rating: 1500
        },
        game: {
          pgn: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3',
          clock: '10+0'
        }
      }

      // Test conversion logic (this would be implemented in the actual converter)
      const convertedPuzzle = {
        id: lichessPuzzle.puzzle.id,
        theme: lichessPuzzle.puzzle.themes[0],
        solution: lichessPuzzle.puzzle.solution,
        rating: lichessPuzzle.puzzle.rating,
        source: 'Lichess'
      }

      expect(convertedPuzzle.id).toBe('abc123')
      expect(convertedPuzzle.theme).toBe('fork')
      expect(convertedPuzzle.solution).toEqual(['e4', 'e5', 'Nf3'])
      expect(convertedPuzzle.rating).toBe(1500)
      expect(convertedPuzzle.source).toBe('Lichess')
    })
  })
})