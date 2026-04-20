# Build packaged extension zips for Chrome and Firefox on Windows.
#
# Usage:
#   .\build.ps1            # both
#   .\build.ps1 chrome
#   .\build.ps1 firefox

param(
    [ValidateSet("chrome", "firefox", "both")]
    [string]$Target = "both"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dist = Join-Path $root "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$manifestText = Get-Content (Join-Path $root "manifest.json") -Raw
$version = ($manifestText | ConvertFrom-Json).version

$commonPaths = @(
    "background.js", "content.js", "styles.css",
    "popup.html", "popup.css", "popup.js",
    "options.html", "options.css", "options.js",
    "icons", "_locales",
    "LICENSE", "PRIVACY.md", "README.md"
)

function Build-One {
    param([string]$Name, [string]$ManifestFile)

    $out = Join-Path $dist ("bidi-fixer-$Name-$version.zip")
    if (Test-Path $out) { Remove-Item $out }

    $staging = Join-Path ([System.IO.Path]::GetTempPath()) ("bidi-" + [System.Guid]::NewGuid())
    New-Item -ItemType Directory -Force -Path $staging | Out-Null

    Copy-Item (Join-Path $root $ManifestFile) (Join-Path $staging "manifest.json")
    foreach ($p in $commonPaths) {
        $src = Join-Path $root $p
        if (Test-Path $src) {
            Copy-Item -Recurse -Force $src (Join-Path $staging $p)
        }
    }

    Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $out -Force
    Remove-Item -Recurse -Force $staging
    Write-Host "Built: $out"
}

switch ($Target) {
    "chrome"  { Build-One "chrome"  "manifest.json" }
    "firefox" { Build-One "firefox" "manifest.firefox.json" }
    "both"    {
        Build-One "chrome"  "manifest.json"
        Build-One "firefox" "manifest.firefox.json"
    }
}
