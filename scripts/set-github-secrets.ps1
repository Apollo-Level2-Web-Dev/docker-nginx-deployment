param(
    [string]$Repo,
    [string]$ServerEnvPath = "server/.env.production",
    [string]$InputSecretsPath = "ci/github-secrets.input.env"
)

$ErrorActionPreference = "Stop"

$GitHubCliPath = $null
$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
    $GitHubCliPath = $ghCommand.Source
}
if (-not $GitHubCliPath) {
    $fallbackPath = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $fallbackPath) {
        $GitHubCliPath = $fallbackPath
    }
}

function Read-EnvFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $values = @{}
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }

        $separatorIndex = $trimmed.IndexOf("=")
        if ($separatorIndex -lt 1) { continue }

        $key = $trimmed.Substring(0, $separatorIndex).Trim()
        $value = $trimmed.Substring($separatorIndex + 1)
        $values[$key] = $value
    }

    return $values
}

function Set-Secret {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "Skipping empty secret: $Name"
        return
    }

    if ($Repo) {
        & $GitHubCliPath secret set $Name --repo $Repo --body $Value | Out-Null
    } else {
        & $GitHubCliPath secret set $Name --body $Value | Out-Null
    }

    Write-Host "Set secret: $Name"
}

if (-not $GitHubCliPath) {
    throw "GitHub CLI is required. Install it and run 'gh auth login' first."
}

$serverEnvText = Get-Content $ServerEnvPath -Raw
$inputSecrets = Read-EnvFile -Path $InputSecretsPath
$serverEnv = Read-EnvFile -Path $ServerEnvPath

$databaseUrl = $serverEnv["DATABASE_URL"]
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    throw "DATABASE_URL not found in $ServerEnvPath"
}

$match = [regex]::Match($databaseUrl, "^postgres(?:ql)?:\/\/[^:]+:(?<pass>[^@]+)@")
if (-not $match.Success) {
    throw "Could not extract Postgres password from DATABASE_URL"
}

$encodedPassword = $match.Groups["pass"].Value
$postgresPassword = [System.Uri]::UnescapeDataString($encodedPassword)

Set-Secret -Name "DOCKERHUB_USERNAME" -Value $inputSecrets["DOCKERHUB_USERNAME"]
Set-Secret -Name "DOCKERHUB_TOKEN" -Value $inputSecrets["DOCKERHUB_TOKEN"]
Set-Secret -Name "VPS_HOST" -Value $inputSecrets["VPS_HOST"]
Set-Secret -Name "VPS_USER" -Value $inputSecrets["VPS_USER"]
Set-Secret -Name "VPS_APP_DIR" -Value $inputSecrets["VPS_APP_DIR"]
Set-Secret -Name "CLIENT_PUBLIC_API_BASE_URL" -Value $inputSecrets["CLIENT_PUBLIC_API_BASE_URL"]
if ([string]::IsNullOrWhiteSpace($inputSecrets["ACCESS_TOKEN_SECRET"])) {
    Set-Secret -Name "ACCESS_TOKEN_SECRET" -Value $serverEnv["ACCESS_TOKEN_SECRET"]
} else {
    Set-Secret -Name "ACCESS_TOKEN_SECRET" -Value $inputSecrets["ACCESS_TOKEN_SECRET"]
}
if ([string]::IsNullOrWhiteSpace($inputSecrets["JWT_ACCESS_SECRET"])) {
    Set-Secret -Name "JWT_ACCESS_SECRET" -Value $serverEnv["JWT_ACCESS_SECRET"]
} else {
    Set-Secret -Name "JWT_ACCESS_SECRET" -Value $inputSecrets["JWT_ACCESS_SECRET"]
}
Set-Secret -Name "POSTGRES_PASSWORD" -Value $postgresPassword
Set-Secret -Name "SERVER_ENV_PRODUCTION" -Value $serverEnvText

Write-Host "Done."
