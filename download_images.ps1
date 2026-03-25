$targetDir = "d:\CODE\project\community\素材\家政"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
}

Write-Host "开始下载家政相关图片..."

$imageUrls = @(
    "https://images.unsplash.com/photo-1581578015325-1108f3f4f317?w=800&q=80",
    "https://images.unsplash.com/photo-1522712107425-730537132317?w=800&q=80",
    "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&q=80"
)

$i = 1
foreach ($url in $imageUrls) {
    $fileName = "jiazheng_$i.jpg"
    $filePath = Join-Path $targetDir $fileName
    Write-Host "下载 $fileName..."
    
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Mozilla/5.0")
        $wc.DownloadFile($url, $filePath)
        Write-Host "成功!"
    } catch {
        Write-Host "失败: $($_.Exception.Message)"
    }
    
    $i++
}

Write-Host "下载完成!"
Get-ChildItem $targetDir
