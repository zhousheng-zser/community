$files = Get-ChildItem 'D:\CODE\project\community' -Recurse -File | Sort-Object Length -Descending | Select-Object -First 40
foreach ($f in $files) {
    $kb = [math]::Round($f.Length / 1KB)
    Write-Output "$kb KB  $($f.FullName)"
}
Write-Output "---"
Write-Output "Top folders by size:"
$dirs = @('img', 'images', 'assets', 'node_modules', 'miniprogram_npm', 'utils', 'pages', 'components', 'icons', 'fuka.jpg')
foreach ($d in $dirs) {
    $path = "D:\CODE\project\community\$d"
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $mb = [math]::Round($size / 1MB, 2)
        Write-Output "$mb MB  $path"
    }
}
