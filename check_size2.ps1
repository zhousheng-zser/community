Write-Output "=== Root files ==="
$files = Get-ChildItem 'D:\CODE\project\community' -File
foreach ($f in $files) {
    $kb = [math]::Round($f.Length / 1KB)
    Write-Output "$kb KB  $($f.Name)"
}

Write-Output ""
Write-Output "=== Top level folders and their sizes ==="
$dirs = Get-ChildItem 'D:\CODE\project\community' -Directory
foreach ($d in $dirs) {
    $size = (Get-ChildItem $d.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $mb = [math]::Round($size / 1MB, 2)
    Write-Output "$mb MB  $($d.Name)"
}
