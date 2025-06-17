/**
 * Puzzle Quality Analysis Script
 * Analyzes the current puzzle database and reports issues
 */

const fs = require('fs');
const path = require('path');

// Load puzzle data
const dataPath = path.join(__dirname, '..', 'src', 'data', 'problems.json');
const puzzleData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const puzzles = puzzleData.puzzles;

console.log('🔍 Chess Hawk Puzzle Quality Analysis');
console.log('=====================================\n');

// Basic statistics
console.log('📊 Database Overview:');
console.log(`   Total puzzles: ${puzzles.length}`);
console.log(`   Database version: ${puzzleData.version}`);
console.log(`   Generated: ${puzzleData.generated}`);
console.log(`   Source: ${puzzleData.source}\n`);

// Theme distribution
console.log('🎯 Theme Distribution:');
const themeCounts = puzzles.reduce((acc, puzzle) => {
  acc[puzzle.theme] = (acc[puzzle.theme] || 0) + 1;
  return acc;
}, {});
Object.entries(themeCounts).forEach(([theme, count]) => {
  console.log(`   ${theme}: ${count} puzzles`);
});
console.log();

// Difficulty distribution
console.log('⭐ Difficulty Distribution:');
const difficultyStats = {
  beginner: puzzles.filter(p => p.difficulty === 'beginner'),
  intermediate: puzzles.filter(p => p.difficulty === 'intermediate'),
  advanced: puzzles.filter(p => p.difficulty === 'advanced')
};

Object.entries(difficultyStats).forEach(([difficulty, puzzleList]) => {
  const ratings = puzzleList.map(p => p.rating);
  const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  console.log(`   ${difficulty}: ${puzzleList.length} puzzles (avg: ${avgRating.toFixed(0)}, range: ${minRating}-${maxRating})`);
});
console.log();

// Duplicate FEN analysis
console.log('🔄 Duplicate Analysis:');
const fenCounts = puzzles.reduce((acc, puzzle) => {
  acc[puzzle.fen] = (acc[puzzle.fen] || 0) + 1;
  return acc;
}, {});

const duplicateFens = Object.entries(fenCounts)
  .filter(([_, count]) => count > 1)
  .sort(([,a], [,b]) => b - a);

console.log(`   Unique positions: ${Object.keys(fenCounts).length}`);
console.log(`   Duplicate positions: ${duplicateFens.length}`);

if (duplicateFens.length > 0) {
  console.log('   Top duplicates:');
  duplicateFens.slice(0, 5).forEach(([fen, count]) => {
    console.log(`     - Used ${count} times: ${fen.substring(0, 50)}...`);
  });
}
console.log();

// Title analysis
console.log('📝 Title Analysis:');
const titleCounts = puzzles.reduce((acc, puzzle) => {
  const baseTitle = puzzle.title.replace(/\s+\d+$/, ''); // Remove numbers
  acc[baseTitle] = (acc[baseTitle] || 0) + 1;
  return acc;
}, {});

const repetitiveTitles = Object.entries(titleCounts)
  .filter(([_, count]) => count > 50)
  .sort(([,a], [,b]) => b - a);

console.log(`   Unique title patterns: ${Object.keys(titleCounts).length}`);
console.log(`   Repetitive titles (>50 uses):`);
repetitiveTitles.forEach(([title, count]) => {
  console.log(`     - "${title}": ${count} times`);
});
console.log();

// Description analysis
console.log('📖 Description Analysis:');
const descriptionCounts = puzzles.reduce((acc, puzzle) => {
  acc[puzzle.description] = (acc[puzzle.description] || 0) + 1;
  return acc;
}, {});

const repetitiveDescriptions = Object.entries(descriptionCounts)
  .filter(([_, count]) => count > 50)
  .sort(([,a], [,b]) => b - a);

console.log(`   Unique descriptions: ${Object.keys(descriptionCounts).length}`);
console.log(`   Repetitive descriptions (>50 uses):`);
repetitiveDescriptions.forEach(([desc, count]) => {
  console.log(`     - "${desc}": ${count} times`);
});
console.log();

// Norwegian content analysis
console.log('🇳🇴 Norwegian Content Analysis:');
const norwegianKeywords = ['angrip', 'samtidig', 'gaffel', 'spiss', 'mat', 'offer', 'trekk', 'hvit', 'sort'];
let norwegianContent = 0;

puzzles.forEach(puzzle => {
  const content = `${puzzle.title} ${puzzle.description} ${puzzle.hint}`.toLowerCase();
  if (norwegianKeywords.some(keyword => content.includes(keyword))) {
    norwegianContent++;
  }
});

console.log(`   Norwegian content: ${norwegianContent}/${puzzles.length} puzzles (${(norwegianContent/puzzles.length*100).toFixed(1)}%)`);
console.log();

// Sample some puzzles for manual inspection
console.log('🔍 Sample Puzzles for Manual Review:');
const samplePuzzles = [puzzles[0], puzzles[50], puzzles[100], puzzles[500], puzzles[999]];
samplePuzzles.forEach((puzzle, index) => {
  console.log(`\n   Sample ${index + 1} (${puzzle.id}):`);
  console.log(`     Title: ${puzzle.title}`);
  console.log(`     Description: ${puzzle.description}`);
  console.log(`     FEN: ${puzzle.fen}`);
  console.log(`     Solution: ${puzzle.solution.join(', ')}`);
  console.log(`     Theme: ${puzzle.theme}, Difficulty: ${puzzle.difficulty}, Rating: ${puzzle.rating}`);
});

console.log('\n\n🚨 Issues Identified:');
console.log('=====================');

let issueCount = 0;

if (duplicateFens.length > 100) {
  console.log(`❌ High number of duplicate positions (${duplicateFens.length})`);
  issueCount++;
}

if (repetitiveTitles.length > 5) {
  console.log(`❌ Very repetitive titles (${repetitiveTitles.length} patterns with >50 uses)`);
  issueCount++;
}

if (repetitiveDescriptions.length > 5) {
  console.log(`❌ Very repetitive descriptions (${repetitiveDescriptions.length} patterns with >50 uses)`);
  issueCount++;
}

if (norwegianContent < puzzles.length * 0.8) {
  console.log(`❌ Low Norwegian localization (${(norwegianContent/puzzles.length*100).toFixed(1)}% vs expected 80%+)`);
  issueCount++;
}

if (Object.keys(fenCounts).length < puzzles.length * 0.7) {
  console.log(`❌ Too many duplicate positions (only ${((Object.keys(fenCounts).length/puzzles.length)*100).toFixed(1)}% unique)`);
  issueCount++;
}

if (issueCount === 0) {
  console.log('✅ No major issues detected!');
} else {
  console.log(`\n💡 Recommendation: Import fresh, high-quality puzzles from Lichess to replace generated content.`);
}

console.log(`\n📋 Analysis complete. Found ${issueCount} major issues.`);