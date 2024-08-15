# https://github.com/PowerShell/PowerShell/issues/2736
function Format-Json([Parameter(Mandatory, ValueFromPipeline)][String] $json) {
  $indent = 0;
  ($json -Split '\n' |
    % {
      if ($_ -match '[\}\]]') {
        # This line contains  ] or }, decrement the indentation level
        $indent--
      }
      $line = (' ' * $indent * 2) + $_.TrimStart().Replace(':  ', ': ')
      if ($_ -match '[\{\[]') {
        # This line contains [ or {, increment the indentation level
        $indent++
      }
      $line
  }) -Join "`n"
}

$manifest = Get-Content '.\src\manifest.json' -raw | ConvertFrom-Json
$package = Get-Content '.\package.json' -raw | ConvertFrom-Json
# $packagelock = Get-Content '.\package-lock.json' -raw | ConvertFrom-Json

$oldManifestVersion = $manifest.version
$manifestVersionArray = $oldManifestVersion.Split(".")
$temp = [convert]::ToInt32($manifestVersionArray[2],10)
$manifestVersionArray[2] = ($temp+1).ToString()
$newManifestVersion = -join($manifestVersionArray[0],".",$manifestVersionArray[1],".",$manifestVersionArray[2])
Write-Output "Version: $oldManifestVersion --> $newManifestVersion"
$manifest.update | % { $manifest.version = $newManifestVersion }
$manifest | ConvertTo-Json | Format-Json | set-content '.\src\manifest.json'
$package.update | % { $package.version = $newManifestVersion }
$package | ConvertTo-Json | Format-Json | set-content '.\package.json'
# $packagelock.update | % { $packagelock.version = $newManifestVersion }
# $packagelock | ConvertTo-Json | Format-Json | set-content '.\package-lock.json'

#delete /dist to clean out obsolte files. Needed b/c new version file are added with new name.
rm -r ./dist