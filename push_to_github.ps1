# Push AuraFeedback to GitHub
param (
    [string]$RepoUrl = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Upload AuraFeedback to GitHub          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if git is available
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "`nGit is not currently installed or not in your PATH." -ForegroundColor Yellow
    Write-Host "To install Git:" -ForegroundColor White
    Write-Host "  1. Download and install Git from: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "     (Or run in an Administrator PowerShell: winget install --id Git.Git -e)" -ForegroundColor Gray
    Write-Host "  2. Re-open your terminal and run this script again: .\push_to_github.ps1`n" -ForegroundColor White
    exit 1
}

# 1. Initialize Git repository
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Green
}

# 2. Add files
Write-Host "Staging files (respecting .gitignore)..." -ForegroundColor Yellow
git add .

# 3. Commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "feat: complete AuraFeedback portal with MySQL database and Glassmorphic frontend"

# 4. Set main branch
git branch -M main

# 5. Remote repository URL
if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "`nEnter your GitHub repository URL (e.g. https://github.com/username/aurafeedback.git):" -ForegroundColor Cyan
    $RepoUrl = Read-Host
}

if (-not [string]::IsNullOrWhiteSpace($RepoUrl)) {
    # Remove existing origin if any
    git remote remove origin 2>$null
    git remote add origin $RepoUrl
    Write-Host "Pushing code to $RepoUrl..." -ForegroundColor Yellow
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS! Your project has been uploaded to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "`nPush failed. Please ensure the GitHub repository exists and you have write permissions." -ForegroundColor Red
    }
} else {
    Write-Host "`nNo URL provided. You can push manually using:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-github-repo-url>"
    Write-Host "  git push -u origin main"
}
