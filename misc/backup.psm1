function backup {
  $scriptPath = Join-Path $PSScriptRoot 'backup.ps1'
  & $scriptPath
}
Export-ModuleMember -Function backup 