[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

function Protect-CommandDiagnostic {
  param(
    [AllowEmptyString()]
    [string]$Text,
    [string[]]$Secrets
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return 'No diagnostic output was returned by App Service.'
  }

  $safeText = $Text
  foreach ($secret in $Secrets) {
    if (-not [string]::IsNullOrWhiteSpace($secret)) {
      $safeText = $safeText.Replace($secret, '[REDACTED]')
    }
  }

  $safeText = $safeText `
    -replace '(?i)(password|pwd)\s*=\s*[^;\s]+', '$1=[REDACTED]' `
    -replace '(?i)(authorization:\s*(basic|bearer))\s+\S+', '$1 [REDACTED]'

  if ($safeText.Length -gt 3000) {
    $safeText = $safeText.Substring($safeText.Length - 3000)
  }

  return $safeText.Trim()
}

if ([string]::IsNullOrWhiteSpace($env:AZURE_WEBAPP_PUBLISH_PROFILE)) {
  throw 'AZURE_WEBAPP_PUBLISH_PROFILE is required.'
}

try {
  [xml]$publishProfiles = $env:AZURE_WEBAPP_PUBLISH_PROFILE
  $profile = @(
    $publishProfiles.publishData.publishProfile |
      Where-Object { $_.publishMethod -eq 'MSDeploy' }
  )[0]

  if ($null -eq $profile) {
    throw 'The publish profile does not contain an MSDeploy entry.'
  }

  $publishUrl = [string]$profile.publishUrl
  if ($publishUrl -notmatch '^https?://') {
    $publishUrl = "https://$publishUrl"
  }

  $commandUri = [UriBuilder]$publishUrl
  $commandUri.Path = '/api/command'
  $commandUri.Query = ''

  $credentialText = '{0}:{1}' -f $profile.userName, $profile.userPWD
  $credentialBytes = [Text.Encoding]::UTF8.GetBytes($credentialText)
  $basicToken = [Convert]::ToBase64String($credentialBytes)

  $requestBody = @{
    command = 'node scripts/migrateLibraryMetadata.js'
    dir = '/home/site/wwwroot'
  } | ConvertTo-Json

  $response = Invoke-RestMethod `
    -Uri $commandUri.Uri `
    -Method Post `
    -Headers @{ Authorization = "Basic $basicToken" } `
    -ContentType 'application/json' `
    -Body $requestBody `
    -TimeoutSec 180
} catch {
  throw 'Unable to execute the reviewed metadata migration through the App Service Kudu endpoint.'
} finally {
  $credentialText = $null
  $credentialBytes = $null
  $basicToken = $null
}

if ($null -eq $response.ExitCode -or [int]$response.ExitCode -ne 0) {
  $combinedDiagnostic = @(
    [string]$response.Output
    [string]$response.Error
  ) -join [Environment]::NewLine
  $safeDiagnostic = Protect-CommandDiagnostic `
    -Text $combinedDiagnostic `
    -Secrets @([string]$profile.userName, [string]$profile.userPWD)
  $exitCode = if ($null -eq $response.ExitCode) { 'missing' } else { [string]$response.ExitCode }

  $failureMessage = 'The reviewed metadata migration command failed inside App Service ' `
    + "(exit code: $exitCode).`n$safeDiagnostic"
  throw $failureMessage
}

Write-Output 'The reviewed library metadata migration completed inside App Service.'
