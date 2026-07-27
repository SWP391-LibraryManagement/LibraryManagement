[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

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
    command = 'npm run migrate:library-metadata'
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
  throw 'The reviewed metadata migration command failed inside App Service.'
}

Write-Output 'The reviewed library metadata migration completed inside App Service.'
