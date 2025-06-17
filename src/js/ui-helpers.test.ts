/**
 * UI Helper Functions Tests
 * 
 * Tests for UI utility functions without DOM mocking.
 * Focus on logic rather than DOM manipulation.
 */

import { describe, it, expect } from 'vitest'

describe('UI Helper Functions', () => {
  
  describe('Feedback Message Generation', () => {
    it('should generate appropriate feedback messages', () => {
      const generateFeedback = (type: string, message: string) => {
        const icons = {
          success: '✅',
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️'
        }
        
        const icon = icons[type] || icons.info
        return `${icon} ${message}`
      }
      
      expect(generateFeedback('success', 'Correct move!')).toBe('✅ Correct move!')
      expect(generateFeedback('error', 'Invalid move')).toBe('❌ Invalid move')
      expect(generateFeedback('warning', 'Be careful')).toBe('⚠️ Be careful')
      expect(generateFeedback('info', 'Hint available')).toBe('ℹ️ Hint available')
      expect(generateFeedback('unknown', 'Test')).toBe('ℹ️ Test') // Default to info
    })
  })
  
  describe('Score Formatting', () => {
    it('should format scores correctly', () => {
      const formatScore = (score: number) => {
        if (score < 1000) return score.toString()
        if (score < 1000000) return `${(score / 1000).toFixed(1)}k`
        return `${(score / 1000000).toFixed(1)}m`
      }
      
      expect(formatScore(0)).toBe('0')
      expect(formatScore(100)).toBe('100')
      expect(formatScore(999)).toBe('999')
      expect(formatScore(1000)).toBe('1.0k')
      expect(formatScore(1500)).toBe('1.5k')
      expect(formatScore(10000)).toBe('10.0k')
      expect(formatScore(1000000)).toBe('1.0m')
      expect(formatScore(2500000)).toBe('2.5m')
    })
  })
  
  describe('Difficulty Display', () => {
    it('should format difficulty levels with appropriate styling', () => {
      const formatDifficulty = (difficulty: string) => {
        const styles = {
          beginner: { emoji: '🟢', color: 'green' },
          intermediate: { emoji: '🟡', color: 'orange' },  
          advanced: { emoji: '🟠', color: 'red' },
          expert: { emoji: '🔴', color: 'darkred' }
        }
        
        const style = styles[difficulty] || styles.beginner
        return {
          text: `${style.emoji} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
          color: style.color
        }
      }
      
      expect(formatDifficulty('beginner')).toEqual({
        text: '🟢 Beginner',
        color: 'green'
      })
      
      expect(formatDifficulty('intermediate')).toEqual({
        text: '🟡 Intermediate', 
        color: 'orange'
      })
      
      expect(formatDifficulty('advanced')).toEqual({
        text: '🟠 Advanced',
        color: 'red'
      })
      
      expect(formatDifficulty('expert')).toEqual({
        text: '🔴 Expert',
        color: 'darkred'
      })
      
      expect(formatDifficulty('unknown')).toEqual({
        text: '🟢 Unknown',
        color: 'green'
      })
    })
  })
  
  describe('Category Display', () => {
    it('should format chess tactic categories', () => {
      const formatCategory = (category: string) => {
        const categoryNames = {
          fork: 'Fork',
          pin: 'Pin',
          skewer: 'Skewer',
          mate: 'Checkmate',
          mateIn1: 'Mate in 1',
          mateIn2: 'Mate in 2',
          sacrifice: 'Sacrifice',
          deflection: 'Deflection',
          decoy: 'Decoy',
          discoveredAttack: 'Discovered Attack'
        }
        
        return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
      }
      
      expect(formatCategory('fork')).toBe('Fork')
      expect(formatCategory('pin')).toBe('Pin')
      expect(formatCategory('mateIn1')).toBe('Mate in 1')
      expect(formatCategory('discoveredAttack')).toBe('Discovered Attack')
      expect(formatCategory('unknown')).toBe('Unknown')
    })
  })
  
  describe('Status Messages', () => {
    it('should generate appropriate status messages for game states', () => {
      const getStatusMessage = (gameState: string, playerTurn: string) => {
        if (gameState === 'checkmate') {
          return `Checkmate! ${playerTurn === 'w' ? 'Black' : 'White'} wins!`
        }
        if (gameState === 'stalemate') {
          return 'Stalemate! Game is a draw.'
        }
        if (gameState === 'check') {
          return `${playerTurn === 'w' ? 'White' : 'Black'} is in check!`
        }
        if (gameState === 'normal') {
          return `${playerTurn === 'w' ? 'White' : 'Black'} to move`
        }
        return 'Game in progress'
      }
      
      expect(getStatusMessage('checkmate', 'w')).toBe('Checkmate! Black wins!')
      expect(getStatusMessage('checkmate', 'b')).toBe('Checkmate! White wins!')
      expect(getStatusMessage('stalemate', 'w')).toBe('Stalemate! Game is a draw.')
      expect(getStatusMessage('check', 'w')).toBe('White is in check!')
      expect(getStatusMessage('check', 'b')).toBe('Black is in check!')
      expect(getStatusMessage('normal', 'w')).toBe('White to move')
      expect(getStatusMessage('normal', 'b')).toBe('Black to move')
      expect(getStatusMessage('unknown', 'w')).toBe('Game in progress')
    })
  })
  
  describe('Time Formatting', () => {
    it('should format time durations correctly', () => {
      const formatTime = (seconds: number) => {
        if (seconds < 60) {
          return `${seconds}s`
        }
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}m ${remainingSeconds}s`
      }
      
      expect(formatTime(30)).toBe('30s')
      expect(formatTime(59)).toBe('59s')
      expect(formatTime(60)).toBe('1m 0s')
      expect(formatTime(90)).toBe('1m 30s')
      expect(formatTime(125)).toBe('2m 5s')
      expect(formatTime(0)).toBe('0s')
    })
  })
  
  describe('Progress Indicators', () => {
    it('should calculate progress percentages', () => {
      const calculateProgress = (completed: number, total: number) => {
        if (total === 0) return 0
        return Math.round((completed / total) * 100)
      }
      
      expect(calculateProgress(0, 10)).toBe(0)
      expect(calculateProgress(5, 10)).toBe(50)
      expect(calculateProgress(10, 10)).toBe(100)
      expect(calculateProgress(3, 8)).toBe(38) // Rounded from 37.5
      expect(calculateProgress(0, 0)).toBe(0) // Edge case
    })
    
    it('should generate progress bar data', () => {
      const getProgressBar = (completed: number, total: number) => {
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
        const width = Math.min(100, Math.max(0, percentage))
        
        return {
          percentage,
          width: `${width}%`,
          text: `${completed}/${total}`,
          isComplete: completed >= total
        }
      }
      
      expect(getProgressBar(3, 10)).toEqual({
        percentage: 30,
        width: '30%',
        text: '3/10',
        isComplete: false
      })
      
      expect(getProgressBar(10, 10)).toEqual({
        percentage: 100,
        width: '100%',
        text: '10/10',
        isComplete: true
      })
      
      expect(getProgressBar(0, 0)).toEqual({
        percentage: 0,
        width: '0%',
        text: '0/0',
        isComplete: true
      })
    })
  })
  
  describe('Validation Helpers', () => {
    it('should validate required UI elements exist', () => {
      const validateElements = (elementIds: string[]) => {
        // Simulate checking if elements exist (without actual DOM)
        const mockElements = ['feedback', 'solution', 'status', 'myBoard']
        
        const missing = elementIds.filter(id => !mockElements.includes(id))
        
        return {
          allPresent: missing.length === 0,
          missing: missing
        }
      }
      
      expect(validateElements(['feedback', 'solution'])).toEqual({
        allPresent: true,
        missing: []
      })
      
      expect(validateElements(['feedback', 'missing', 'status'])).toEqual({
        allPresent: false,
        missing: ['missing']
      })
    })
  })
})