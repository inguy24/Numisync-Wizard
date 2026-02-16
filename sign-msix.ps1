# Sign MSIX for local testing

$certThumbprint = "9E813F34C1B03B9A005D8A642CC95ABA84E2D9B8"
$msixPath = "dist\NumiSync Wizard-1.0.0.msix"
$pfxPath = "test-cert.pfx"
$pfxPassword = "test123"

# Export certificate to PFX
Write-Host "Exporting certificate..."
$cert = Get-ChildItem -Path "Cert:\CurrentUser\My\$certThumbprint"
$pwd = ConvertTo-SecureString -String $pfxPassword -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd | Out-Null

# Install certificate to Trusted Root
Write-Host "Installing certificate to Trusted Root..."
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $pfxPassword)
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()

# Sign the MSIX
Write-Host "Signing MSIX package..."
$signTool = "C:\Users\shane.SHANEBURKHARDT\AppData\Local\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\windows-10\x64\signtool.exe"
& $signTool sign /fd SHA256 /a /f $pfxPath /p $pfxPassword $msixPath

Write-Host "`nDone! The MSIX package is now signed and ready to install."
Write-Host "You can install it with:"
Write-Host "  Add-AppxPackage '$msixPath'"
