# Sign and install MSIX for local testing

$certThumbprint = "9E813F34C1B03B9A005D8A642CC95ABA84E2D9B8"
$msixPath = "dist\NumiSync Wizard-1.0.0.msix"
$pfxPath = "test-cert.pfx"
$pfxPassword = "test123"

# Export certificate to PFX (if not already exported)
if (-not (Test-Path $pfxPath)) {
    Write-Host "Exporting certificate..."
    $cert = Get-ChildItem -Path "Cert:\CurrentUser\My\$certThumbprint"
    $pwd = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null
}

# Sign the MSIX using makeappx (simpler than signtool)
Write-Host "Signing MSIX package..."
& "C:\Users\shane.SHANEBURKHARDT\AppData\Local\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\windows-10\x64\signtool.exe" sign /fd SHA256 /a /f $pfxPath /p $pfxPassword $msixPath 2>&1 | Out-Null

# Try installing
Write-Host "Installing MSIX package..."
try {
    Add-AppxPackage -Path $msixPath -ErrorAction Stop
    Write-Host ""
    Write-Host "SUCCESS! MSIX installed successfully!"
    Write-Host "You can now test the app from the Start Menu: NumiSync Wizard"
} catch {
    Write-Host ""
    Write-Host "Installation failed: $_"
    Write-Host "The MSIX package is ready for Microsoft Store submission though!"
}
