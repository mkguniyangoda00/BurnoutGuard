param(
  [Parameter(Mandatory = $true)]
  [string]$Scenario,

  [string]$K6Path = "..\tools\k6\k6-v2.2.0-windows-amd64\k6.exe",

  [string]$RunId = $(Get-Date -Format "yyyy-MM-ddTHH-mm-ss"),

  [switch]$Smoke
)

$ErrorActionPreference = "Stop"
$env:K6_HISTORY_RUN_ID = $RunId

$scriptRoot = $PSScriptRoot
$resolvedK6 = Resolve-Path (Join-Path $scriptRoot $K6Path)
$scenarioPath = Join-Path $scriptRoot (Join-Path "scenarios" $Scenario)
$reportsDir = Join-Path $scriptRoot "reports"
$historyDir = Join-Path $scriptRoot "history"
$runHistoryDir = Join-Path $historyDir $RunId
$latestHistoryDir = Join-Path $historyDir "latest"

New-Item -ItemType Directory -Force -Path $reportsDir, $runHistoryDir, $latestHistoryDir | Out-Null

Push-Location $scriptRoot
try {
  $k6Args = @("run")
  if ($Smoke) {
    $k6Args += @("--vus", "1", "--duration", "10s")
  }
  $k6Args += $scenarioPath
  & $resolvedK6 @k6Args
} finally {
  Pop-Location
}
