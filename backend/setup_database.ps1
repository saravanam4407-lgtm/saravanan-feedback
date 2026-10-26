# AuraFeedback MySQL Database Setup Script
param (
    [string]$Password = "saravanan@4407"
)

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) {
        $mysqlPath = $mysqlCmd.Source
    } else {
        Write-Error "Could not find mysql.exe. Ensure MySQL Server is installed."
        exit 1
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AuraFeedback MySQL Database Setup      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($Password)) {
    $Password = Read-Host -Prompt "Enter your MySQL root password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$schemaPath = Join-Path $PSScriptRoot "schema.sql"
Write-Host "Executing schema from: $schemaPath" -ForegroundColor Yellow

$env:MYSQL_PWD = $Password
try {
    & $mysqlPath -u root -e "source $schemaPath"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS! Database 'aurafeedback_db' created and seeded successfully!" -ForegroundColor Green
        
        # Update .env password automatically
        $envFile = Join-Path $PSScriptRoot ".env"
        if (Test-Path $envFile) {
            $content = Get-Content $envFile -Raw
            $content = $content -replace "DB_PASSWORD=.*", "DB_PASSWORD=$Password"
            Set-Content -Path $envFile -Value $content -Encoding UTF8
            Write-Host "Updated backend/.env with your MySQL password." -ForegroundColor Green
        }
    } else {
        Write-Host "Failed to execute schema. Please verify your root password." -ForegroundColor Red
    }
} finally {
    Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
