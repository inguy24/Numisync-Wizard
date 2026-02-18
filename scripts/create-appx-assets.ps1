# Creates all required MSIX tile assets from existing docs/assets source images
# Output goes to build/appx/ where electron-builder picks them up

Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\docs\assets'
$out = Join-Path $PSScriptRoot '..\build\appx'

New-Item -ItemType Directory -Force -Path $out | Out-Null

function Resize-Image($srcPath, $destPath, $width, $height) {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $width, $height)
    $g.Dispose(); $img.Dispose()
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  Created: $(Split-Path $destPath -Leaf) (${width}x${height})"
}

function Create-Composite($iconPath, $destPath, $canvasW, $canvasH, $bgHex) {
    $icon = [System.Drawing.Image]::FromFile((Resolve-Path $iconPath))
    $bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $bg = [System.Drawing.ColorTranslator]::FromHtml($bgHex)
    $g.Clear($bg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    # Scale icon to fit with padding
    $padding = [int]($canvasH * 0.15)
    $maxH = $canvasH - ($padding * 2)
    $maxW = $canvasW - ($padding * 2)
    $scale = [Math]::Min($maxW / $icon.Width, $maxH / $icon.Height)
    $iw = [int]($icon.Width * $scale)
    $ih = [int]($icon.Height * $scale)
    $x = [int](($canvasW - $iw) / 2)
    $y = [int](($canvasH - $ih) / 2)

    $g.DrawImage($icon, $x, $y, $iw, $ih)
    $g.Dispose(); $icon.Dispose()
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  Created: $(Split-Path $destPath -Leaf) (${canvasW}x${canvasH})"
}

$icon71       = "$src\app_tile_icon_71.png"
$icon150      = "$src\app_tile_icon_150.png"
$icon300      = "$src\app_tile_icon_300.png"
$logoWithText = "$src\logo_with_text.png"

# Background color for wide/splash tiles — change this hex if you want a different color
$bgColor = "#ffffff"

Write-Host "Generating MSIX tile assets..."

# Square tiles (resize from source)
Copy-Item $icon150 "$out\Square150x150Logo.png" -Force
Write-Host "  Copied: Square150x150Logo.png (150x150)"

Resize-Image $icon300 "$out\Square310x310Logo.png" 310 310
Resize-Image $icon71  "$out\Square44x44Logo.png"   44  44
Resize-Image $icon71  "$out\StoreLogo.png"          50  50
Resize-Image $icon71  "$out\BadgeLogo.png"          24  24

# Wide and splash (logo_with_text centered on white background)
Create-Composite $logoWithText "$out\Wide310x150Logo.png" 310 150 $bgColor
Create-Composite $logoWithText "$out\SplashScreen.png"    620 300 $bgColor

Write-Host ""
Write-Host "Done! All assets written to: $out"
Write-Host "Next: npm run build:msix"
