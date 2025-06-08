#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Batch importer for ChessHawk - imports 100 puzzles of each theme from Lichess
.DESCRIPTION
    This script imports 100 puzzles from each available theme on Lichess,
    combines them all, and replaces the existing problems.json file.
#>

# Import required modules
$ErrorActionPreference = "Stop"

Write-Host "🎯 ChessHawk Batch Puzzle Importer" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""

# Define all available themes to import
$themes = @(
    "fork",
    "pin", 
    "skewer",
    "mate",
    "mateIn1",
    "mateIn2",
    "mateIn3",
    "sacrifice",
    "deflection",
    "decoy",
    "discoveredAttack",
    "attraction",
    "clearance",
    "interference",
    "removal",
    "xRayAttack",
    "doubleCheck",
    "smotheredMate",
    "backRankMate",
    "hangingPiece"
)

Write-Host "📋 Temaer som importeres:" -ForegroundColor Cyan
$themes | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
Write-Host ""

# Create backup of existing problems.json
$backupFile = "src\data\problems.json.backup.$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
if (Test-Path "src\data\problems.json") {
    Write-Host "💾 Backup av eksisterende problems.json -> $backupFile" -ForegroundColor Yellow
    Copy-Item "src\data\problems.json" $backupFile
}

# Create temporary directory for individual imports
$tempDir = "temp_imports"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "🚀 Starter import av $($themes.Count) temaer (100 problemer hver)..." -ForegroundColor Green
Write-Host ""

$totalProblems = 0
$successfulThemes = @()
$failedThemes = @()

# Import each theme
foreach ($theme in $themes) {
    Write-Host "🌐 Importerer tema: $theme" -ForegroundColor Cyan
    
    try {
        # Run the import script for this theme
        $output = node import-puzzles.js --count=100 --theme=$theme --output="temp_$theme.json" 2>&1
        
        # Check if the import was successful
        $outputFile = "imported-puzzles\temp_$theme.json"
        if (Test-Path $outputFile) {
            # Move the file to our temp directory
            $tempFile = "$tempDir\$theme.json"
            Move-Item $outputFile $tempFile
            
            # Parse the JSON to count problems
            $jsonContent = Get-Content $tempFile | ConvertFrom-Json
            $problemCount = $jsonContent.problems.Count
            $totalProblems += $problemCount
            $successfulThemes += $theme
            
            Write-Host "   ✅ Suksess: $problemCount problemer importert" -ForegroundColor Green
        } else {
            throw "Output file not found"
        }
    }
    catch {
        Write-Host "   ❌ Feil ved import av $theme`: $($_.Exception.Message)" -ForegroundColor Red
        $failedThemes += $theme
    }
    
    # Small delay to be nice to the API
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "📊 Import-sammendrag:" -ForegroundColor Cyan
Write-Host "   ✅ Vellykkede temaer: $($successfulThemes.Count)" -ForegroundColor Green
Write-Host "   ❌ Mislykkede temaer: $($failedThemes.Count)" -ForegroundColor Red
Write-Host "   📈 Totale problemer: $totalProblems" -ForegroundColor Yellow

if ($failedThemes.Count -gt 0) {
    Write-Host "   ⚠️  Mislykkede: $($failedThemes -join ', ')" -ForegroundColor Red
}
Write-Host ""

if ($successfulThemes.Count -eq 0) {
    Write-Host "❌ Ingen temaer ble importert. Avbryter..." -ForegroundColor Red
    exit 1
}

# Combine all imported files
Write-Host "🔄 Kombinerer alle importerte problemer..." -ForegroundColor Cyan

$allProblems = @()
$allMetadata = @{
    exportDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    totalProblems = 0
    sources = @("lichess")
    generatedBy = "ChessHawk Batch Importer PowerShell Script"
    themes = $successfulThemes
    importDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    failedThemes = $failedThemes
}

# Read and combine all theme files
foreach ($theme in $successfulThemes) {
    $themeFile = "$tempDir\$theme.json"
    if (Test-Path $themeFile) {
        $themeData = Get-Content $themeFile | ConvertFrom-Json
        $allProblems += $themeData.problems
        Write-Host "   📁 $theme`: $($themeData.problems.Count) problemer" -ForegroundColor Gray
    }
}

# Remove duplicates based on ID (just in case)
$uniqueProblems = $allProblems | Sort-Object id -Unique
$duplicatesRemoved = $allProblems.Count - $uniqueProblems.Count

if ($duplicatesRemoved -gt 0) {
    Write-Host "   🧹 Fjernet $duplicatesRemoved duplikater" -ForegroundColor Yellow
}

# Update metadata
$allMetadata.totalProblems = $uniqueProblems.Count

# Create final combined JSON
$finalData = @{
    problems = $uniqueProblems
    metadata = $allMetadata
}

# Convert to JSON with proper formatting
$jsonOutput = $finalData | ConvertTo-Json -Depth 10 -Compress:$false

# Save to problems.json
Write-Host "💾 Lagrer til src\data\problems.json..." -ForegroundColor Cyan
$jsonOutput | Out-File -FilePath "src\data\problems.json" -Encoding utf8

# Cleanup temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "🎉 IMPORT FULLFØRT!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "📊 Finale statistikker:" -ForegroundColor Cyan
Write-Host "   📁 Total problemer i problems.json: $($uniqueProblems.Count)" -ForegroundColor Green
Write-Host "   🎯 Vellykkede temaer: $($successfulThemes.Count)/$($themes.Count)" -ForegroundColor Yellow
Write-Host "   💾 Backup lagret som: $backupFile" -ForegroundColor Gray

if ($failedThemes.Count -gt 0) {
    Write-Host "   ⚠️  Temaer som feilet: $($failedThemes -join ', ')" -ForegroundColor Red
    Write-Host "      Du kan prøve disse manuelt senere" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ problems.json er nå oppdatert med $($uniqueProblems.Count) nye problemer!" -ForegroundColor Green
Write-Host "🎮 Du kan nå teste ChessHawk med den nye databasen" -ForegroundColor Cyan

# Clean up any remaining files in imported-puzzles directory
$importedDir = "imported-puzzles"
if (Test-Path $importedDir) {
    Get-ChildItem $importedDir -Filter "temp_*.json" | Remove-Item -Force
    Write-Host "🧹 Ryddet opp i temp-filer" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Klar for testing! Åpne index.html for å teste de nye problemene." -ForegroundColor Green
