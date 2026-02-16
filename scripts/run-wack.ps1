# Windows App Certification Kit (WACK) Test Runner
# Validates MSIX package before Microsoft Store submission

param(
    [string]$MsixPath = "",
    [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Windows App Certification Kit Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Locate MSIX package
if ($MsixPath -eq "") {
    $distFolder = Join-Path $PSScriptRoot "..\dist"

    if (-not (Test-Path $distFolder)) {
        Write-Host "ERROR: dist folder not found at $distFolder" -ForegroundColor Red
        Write-Host "Run 'npm run build:msix' first to create the MSIX package.`n" -ForegroundColor Yellow
        exit 1
    }

    $msixFiles = Get-ChildItem -Path $distFolder -Filter "*.msix" | Sort-Object LastWriteTime -Descending

    if ($msixFiles.Count -eq 0) {
        Write-Host "ERROR: No .msix files found in dist folder" -ForegroundColor Red
        Write-Host "Run 'npm run build:msix' first to create the MSIX package.`n" -ForegroundColor Yellow
        exit 1
    }

    $MsixPath = $msixFiles[0].FullName
    Write-Host "Found MSIX package: $($msixFiles[0].Name)" -ForegroundColor Green
} else {
    if (-not (Test-Path $MsixPath)) {
        Write-Host "ERROR: Specified MSIX file not found: $MsixPath" -ForegroundColor Red
        exit 1
    }
    Write-Host "Using specified MSIX: $MsixPath" -ForegroundColor Green
}

# Step 2: Locate WACK executable
$wackPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe",
    "C:\Program Files\Windows Kits\10\App Certification Kit\appcert.exe"
)

$wackExe = $null
foreach ($path in $wackPaths) {
    if (Test-Path $path) {
        $wackExe = $path
        break
    }
}

if ($null -eq $wackExe) {
    Write-Host "ERROR: Windows App Certification Kit not found" -ForegroundColor Red
    Write-Host "`nThe Windows App Certification Kit is not installed on this system." -ForegroundColor Yellow
    Write-Host "Install it from the Microsoft Store or Windows SDK:`n" -ForegroundColor Yellow
    Write-Host "  Option 1: Microsoft Store - Search 'Windows App Certification Kit'" -ForegroundColor Cyan
    Write-Host "  Option 2: Windows SDK - https://developer.microsoft.com/windows/downloads/windows-sdk/`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "Found WACK executable: $wackExe`n" -ForegroundColor Green

# Step 3: Prepare output location
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFolder = Join-Path $env:LOCALAPPDATA "Microsoft\Windows App Certification Kit"

if (-not (Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}

# Use a simple filename without spaces to avoid quoting issues
$reportPath = Join-Path $outputFolder "NumiSync_WACK_$timestamp.xml"

Write-Host "Report will be saved to: $reportPath`n" -ForegroundColor Cyan

# Step 4: Run WACK tests
Write-Host "Running Windows App Certification Kit tests..." -ForegroundColor Cyan
Write-Host "This will take 5-10 minutes. Please wait...`n" -ForegroundColor Yellow

try {
    # Run WACK in command-line mode
    # Correct syntax based on Microsoft documentation:
    # appcert test -appxpackagepath <path.msix> -reportoutputpath <path.xml>
    # Note: Paths with spaces must be properly quoted

    # First reset any previous test state
    Start-Process -FilePath $wackExe -ArgumentList @(
        "reset"
    ) -NoNewWindow -Wait -PassThru | Out-Null

    # Build command with proper quoting for paths with spaces
    $arguments = @(
        "test",
        "-appxpackagepath", "`"$MsixPath`"",
        "-reportoutputpath", "`"$reportPath`""
    )

    Write-Host "Running command: $wackExe $($arguments -join ' ')`n" -ForegroundColor Gray

    # Run the actual tests
    $process = Start-Process -FilePath $wackExe -ArgumentList $arguments -NoNewWindow -Wait -PassThru

    if ($process.ExitCode -ne 0) {
        Write-Host "`nWARNING: WACK completed with exit code $($process.ExitCode)" -ForegroundColor Yellow
        Write-Host "This may indicate test failures. Check the report for details.`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`nERROR: Failed to run WACK tests" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 5: Parse and display results
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "WACK Test Results" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if the XML report was created
if (Test-Path $reportPath) {
    Write-Host "Report saved to: $reportPath" -ForegroundColor Green

    try {
        # Parse XML report
        [xml]$xmlReport = Get-Content $reportPath

        # Get overall result
        $overallResult = $xmlReport.REPORT.OVERALL_RESULT

        Write-Host "`nOverall Result: " -NoNewline
        if ($overallResult -eq "PASS") {
            Write-Host "PASSED [OK]" -ForegroundColor Green
        } elseif ($overallResult -eq "FAIL") {
            Write-Host "FAILED [X]" -ForegroundColor Red
        } else {
            Write-Host $overallResult -ForegroundColor Yellow
        }

        # Count test results
        $tests = $xmlReport.REPORT.TEST
        if ($tests) {
            $passed = ($tests | Where-Object { $_.RESULT -eq "PASS" }).Count
            $failed = ($tests | Where-Object { $_.RESULT -eq "FAIL" }).Count
            $warnings = ($tests | Where-Object { $_.RESULT -eq "WARNING" }).Count
            $notRun = ($tests | Where-Object { $_.RESULT -eq "NOT_RUN" }).Count

            Write-Host "`nTest Summary:"
            Write-Host "  Passed:   $passed" -ForegroundColor Green
            if ($failed -gt 0) {
                Write-Host "  Failed:   $failed" -ForegroundColor Red
            }
            if ($warnings -gt 0) {
                Write-Host "  Warnings: $warnings" -ForegroundColor Yellow
            }
            if ($notRun -gt 0) {
                Write-Host "  Not Run:  $notRun" -ForegroundColor Gray
            }

            # Show failed tests details
            if ($failed -gt 0) {
                Write-Host "`nFailed Tests:" -ForegroundColor Red
                $tests | Where-Object { $_.RESULT -eq "FAIL" } | ForEach-Object {
                    Write-Host "  - $($_.title)" -ForegroundColor Red
                    if ($_.MESSAGES.MESSAGE) {
                        $_.MESSAGES.MESSAGE | ForEach-Object {
                            Write-Host "    $($_.InnerText)" -ForegroundColor Gray
                        }
                    }
                }
            }

            # Show warnings
            if ($warnings -gt 0) {
                Write-Host "`nWarnings:" -ForegroundColor Yellow
                $tests | Where-Object { $_.RESULT -eq "WARNING" } | ForEach-Object {
                    Write-Host "  - $($_.title)" -ForegroundColor Yellow
                }
            }
        }

        Write-Host "`nNext Steps:" -ForegroundColor Cyan
        if ($overallResult -eq "PASS") {
            Write-Host "  [OK] Your app passed all certification tests!" -ForegroundColor Green
            Write-Host "  [OK] Safe to submit to Microsoft Store" -ForegroundColor Green
        } elseif ($overallResult -eq "FAIL") {
            Write-Host "  [!] Fix the failed tests before submitting to Store" -ForegroundColor Red
            Write-Host "  [!] Review the XML report for detailed error messages" -ForegroundColor Red
        }

    } catch {
        Write-Host "Could not parse XML report" -ForegroundColor Yellow
        Write-Host $_.Exception.Message -ForegroundColor Gray
    }

    # Offer to open the XML report
    if (-not $NoOpen) {
        Write-Host "`nOpening XML report in default viewer...`n" -ForegroundColor Cyan
        Start-Process $reportPath
    } else {
        Write-Host "`nTo view the full report, open: $reportPath`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "ERROR: Report file not found at $reportPath" -ForegroundColor Red
    Write-Host "Check $outputFolder for results`n" -ForegroundColor Yellow
}

# Step 6: Exit with appropriate code
if ($process.ExitCode -eq 0) {
    Write-Host "========================================`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "========================================`n" -ForegroundColor Yellow
    exit $process.ExitCode
}
