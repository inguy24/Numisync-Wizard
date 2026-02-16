# Sign MSIX using PowerShell method

$certThumbprint = "9E813F34C1B03B9A005D8A642CC95ABA84E2D9B8"
$msixPath = "dist\NumiSync Wizard-1.0.0.msix"

Write-Host "Signing MSIX with PowerShell..."
$cert = Get-ChildItem -Path "Cert:\CurrentUser\My\$certThumbprint"
try {
    Set-AuthenticodeSignature -FilePath $msixPath -Certificate $cert -HashAlgorithm SHA256 -TimestampServer "http://timestamp.digicert.com"
    Write-Host "`nMSIX signed successfully!"
    Write-Host "Try installing with: Add-AppxPackage '$msixPath'"
} catch {
    Write-Host "Error signing: $_"
    Write-Host "`nMSIX packages may require specific signing. You can:"
    Write-Host "1. Submit the unsigned MSIX to Microsoft Store (they will sign it)"
    Write-Host "2. Or test the app by running 'npm start' in development mode"
}
