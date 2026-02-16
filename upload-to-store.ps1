# Upload MSIX to Microsoft Store using StoreBroker
# This bypasses the web upload and may avoid firewall issues

# Install StoreBroker module (one-time setup)
Write-Host "Checking for StoreBroker module..."
if (-not (Get-Module -ListAvailable -Name StoreBroker)) {
    Write-Host "Installing StoreBroker module..."
    Install-Module -Name StoreBroker -Force -Scope CurrentUser
} else {
    Write-Host "StoreBroker already installed."
}

# Import module
Import-Module StoreBroker

Write-Host "`nConfiguring Partner Center authentication..."
Write-Host "You'll need your Azure AD application credentials from Partner Center."
Write-Host "Go to: https://partner.microsoft.com/dashboard/account/v3/credentials/user/tenantuser"
Write-Host ""

# Set up authentication (you'll need to get these from Partner Center)
$tenantId = Read-Host "Enter your Tenant ID"
$clientId = Read-Host "Enter your Client ID"
$clientSecret = Read-Host "Enter your Client Secret" -AsSecureString

Set-StoreBrokerAuthentication -TenantId $tenantId -ClientId $clientId -ClientSecret $clientSecret

Write-Host "`nAuthentication configured!"
Write-Host ""
Write-Host "To upload your package, you'll need:"
Write-Host "  1. Your App ID from Partner Center"
Write-Host "  2. The MSIX file path"
Write-Host ""
Write-Host "Example upload command:"
Write-Host '  New-SubmissionPackage -AppId "YOUR_APP_ID" -PackagePath "dist\NumiSync Wizard-1.0.0.msix" -SubmissionDataPath "submission.json"'
Write-Host ""
Write-Host "See StoreBroker documentation: https://github.com/microsoft/StoreBroker"
