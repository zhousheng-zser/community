$root = 'D:\CODE\project\community'
$exclude = @('admin', 'backend', 'doc', '.claude', '.vscode', '.git')
$excludeFiles = @('fuka.jpg', 'b.jpg', 'buy.jpg', 'accessby.jpg', 'address.jpg',
    'add_icon_effects.py', 'add_icon_effects_v2.py', 'generate_icons.py',
    'process_images.py', 'download_images.ps1', 'check_size.ps1', 'check_size2.ps1',
    'check_final.ps1', 'check_img.ps1', 'install.cmd', 'test_community.js',
    'package-lock.json', 'package.json')
$excludeFolders = @('素材', 'img\placeholders', 'img/placeholders')

$total = 0
$files = Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue
foreach ($f in $files) {
    $rel = $f.FullName.Replace($root + '\', '')
    $skip = $false
    foreach ($ex in $exclude) {
        if ($rel.StartsWith($ex + '\') -or $rel.StartsWith($ex + '/')) { $skip = $true; break }
    }
    foreach ($ex in $excludeFiles) {
        if ($f.Name -eq $ex) { $skip = $true; break }
    }
    foreach ($ex in $excludeFolders) {
        if ($rel.StartsWith($ex + '\') -or $rel.StartsWith($ex + '/') -or $rel -like "*placeholders*") { $skip = $true; break }
    }
    if (!$skip) { $total += $f.Length }
}

Write-Output "Estimated package size after packOptions: $([math]::Round($total/1MB, 2)) MB ($([math]::Round($total/1KB)) KB)"

Write-Output ""
Write-Output "Breakdown of remaining large dirs:"
$bigdirs = @('img\icons\jiaz', 'img\undraw', 'img\order', 'img\coupons', 'pages', 'tpl', 'img')
foreach ($d in $bigdirs) {
    $path = "$root\$d"
    if (Test-Path $path) {
        $sz = (Get-ChildItem $path -Recurse -File | Measure-Object -Property Length -Sum).Sum
        if ($d -eq 'img') {
            # subtract placeholders
            $plpath = "$root\img\placeholders"
            if (Test-Path $plpath) {
                $pl = (Get-ChildItem $plpath -Recurse -File | Measure-Object -Property Length -Sum).Sum
                $sz -= $pl
            }
        }
        Write-Output "  $([math]::Round($sz/1KB)) KB  $d"
    }
}
