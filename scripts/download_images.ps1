$images = @(
    "https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Image+1",
    "https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Image+2",
    "https://via.placeholder.com/800x600/45B7D1/FFFFFF?text=Image+3",
    "https://via.placeholder.com/800x600/96CEB4/FFFFFF?text=Image+4",
    "https://via.placeholder.com/800x600/FFEAA7/000000?text=Image+5",
    "https://via.placeholder.com/800x600/DDA0DD/FFFFFF?text=Image+6",
    "https://via.placeholder.com/800x600/98D8C8/FFFFFF?text=Image+7",
    "https://via.placeholder.com/800x600/F7DC6F/000000?text=Image+8",
    "https://via.placeholder.com/800x600/BB8FCE/FFFFFF?text=Image+9",
    "https://via.placeholder.com/800x600/85C1E9/FFFFFF?text=Image+10"
)
$dest = "C:\Users\Administrator\Desktop\zser"
for ($i = 0; $i -lt $images.Length; $i++) {
    $name = "image_$($i+1).jpg"
    Write-Host "Downloading $name..."
    try {
        Invoke-WebRequest -Uri $images[$i] -OutFile (Join-Path $dest $name) -UseBasicParsing -TimeoutSec 15
        Write-Host "  OK: $name"
    } catch {
        Write-Host "  FAIL: $name - $($_.Exception.Message)"
    }
}
Write-Host "Done!"
