# Book of Truth Installer and Updater

$repoUrl = "https://github.com/yourusername/book-of-truth.git"
$installDir = "$env:USERPROFILE\BookOfTruth"

function Install-BookOfTruth {
    if (Test-Path $installDir) {
        Write-Host "Book of Truth is already installed. Use the update option to get the latest version."
        return
    }

    Write-Host "Installing Book of Truth..."
    
    # Clone the repository
    git clone $repoUrl $installDir

    # Navigate to the installation directory
    Set-Location $installDir

    # Install dependencies
    npm install

    Write-Host "Book of Truth has been successfully installed!"
}

function Update-BookOfTruth {
    if (-not (Test-Path $installDir)) {
        Write-Host "Book of Truth is not installed. Please use the install option first."
        return
    }

    Write-Host "Updating Book of Truth..."

    # Navigate to the installation directory
    Set-Location $installDir

    # Fetch the latest changes
    git fetch origin main

    # Check if there are any updates
    $status = git status -uno
    if ($status -match "Your branch is up to date") {
        Write-Host "Book of Truth is already up to date."
        return
    }

    # Pull the latest changes
    git pull origin main

    # Install any new dependencies
    npm install

    Write-Host "Book of Truth has been successfully updated!"
}

function Start-BookOfTruth {
    if (-not (Test-Path $installDir)) {
        Write-Host "Book of Truth is not installed. Please use the install option first."
        return
    }

    Write-Host "Starting Book of Truth..."

    # Navigate to the installation directory
    Set-Location $installDir

    # Start the backend server
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server"

    # Start the frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

    Write-Host "Book of Truth is now running. Access it at http://localhost:3000"
}

# Main menu
do {
    Write-Host "`n=== Book of Truth Installer ==="
    Write-Host "1. Install Book of Truth"
    Write-Host "2. Update Book of Truth"
    Write-Host "3. Start Book of Truth"
    Write-Host "4. Exit"

    $choice = Read-Host "Enter your choice (1-4)"

    switch ($choice) {
        "1" { Install-BookOfTruth }
        "2" { Update-BookOfTruth }
        "3" { Start-BookOfTruth }
        "4" { Write-Host "Exiting..."; break }
        default { Write-Host "Invalid choice. Please try again." }
    }
} while ($choice -ne "4")