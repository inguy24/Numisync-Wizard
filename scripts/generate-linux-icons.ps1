# Generate multi-resolution PNG icons for Linux
# Uses .NET System.Drawing to resize build/icon.png to multiple sizes

param(
    [string]$SourceIcon = "build\icon.png",
    [string]$OutputDir = "build\icons"
)

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Icon sizes needed for Linux
$sizes = @(16, 32, 48, 64, 128, 256, 512)

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Check if source icon exists
if (-not (Test-Path $SourceIcon)) {
    Write-Error "Source icon not found: $SourceIcon"
    exit 1
}

Write-Host "Generating Linux icons from $SourceIcon..." -ForegroundColor Green

# Load the source image
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $SourceIcon))

foreach ($size in $sizes) {
    $outputPath = Join-Path $OutputDir "${size}x${size}.png"

    # Create a new bitmap with the target size
    $resizedImage = New-Object System.Drawing.Bitmap($size, $size)

    # Create graphics object for high-quality resize
    $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Draw the resized image
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)

    # Save the resized image
    $resizedImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Cleanup
    $graphics.Dispose()
    $resizedImage.Dispose()

    Write-Host "  Created ${size}x${size}.png" -ForegroundColor Cyan
}

# Cleanup source image
$sourceImage.Dispose()

Write-Host "`n✅ Successfully generated $($sizes.Count) Linux icon files" -ForegroundColor Green
Write-Host "   Output directory: $OutputDir" -ForegroundColor Gray
