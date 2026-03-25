$root = 'D:\CODE\project\community'
$includeDirs = @('pages', 'tpl', 'utils', 'custom-tab-bar', 'img')
$includeFiles = @('app.js', 'app.json', 'app.wxss')

$total = 0

# Root files
foreach ($fn in $includeFiles) {
    $f = Get-Item "$root\$fn" -ErrorAction SilentlyContinue
    if ($f) { $total += $f.Length; Write-Output "$([math]::Round($f.Length/1KB)) KB  $fn" }
}

# Directories
foreach ($d in $includeDirs) {
    $path = "$root\$d"
    if (Test-Path $path) {
        $files = Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue
        if ($d -eq 'img') {
            $files = $files | Where-Object { $_.FullName -notlike '*placeholders*' }
        }
        $sz = ($files | Measure-Object -Property Length -Sum).Sum
        $total += $sz
        Write-Output "$([math]::Round($sz/1KB)) KB  $d/"
    }
}

Write-Output ""
Write-Output "Total mini program package (estimated): $([math]::Round($total/1KB)) KB ($([math]::Round($total/1MB, 2)) MB)"
Write-Output ""
Write-Output "WeChat limits:"
Write-Output "  Single package (no subpackages): 2 MB"
Write-Output "  With subpackages: main <= 2MB, each sub <= 2MB, total <= 20MB"
