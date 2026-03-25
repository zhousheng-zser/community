Write-Output "=== img/ folder contents with sizes ==="
$files = Get-ChildItem 'D:\CODE\project\community\img' -Recurse -File
foreach ($f in $files) {
    $kb = [math]::Round($f.Length / 1KB)
    $rel = $f.FullName.Replace('D:\CODE\project\community\', '')
    Write-Output "$kb KB  $rel"
}

Write-Output ""
Write-Output "=== Total img size ==="
$total = ($files | Measure-Object -Property Length -Sum).Sum
Write-Output "$([math]::Round($total/1MB, 2)) MB"
