$sourceDir = "c:\Users\ATIF AHMED\Downloads\DairySetu-TN-Secured"
$zipPath = "c:\Users\ATIF AHMED\Downloads\DairySetu-TN-Secured.zip"
$tempZip = "c:\Users\ATIF AHMED\Downloads\DairySetu-TN-Secured-temp.zip"

Write-Host "Creating fresh ZIP archive excluding transient folders..."
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }

$items = Get-ChildItem -Path $sourceDir | Where-Object { 
    $_.Name -ne 'node_modules' -and 
    $_.Name -ne '.venv' -and 
    $_.Name -ne '__pycache__' -and 
    $_.Name -ne '.pytest_cache' -and
    $_.Name -ne 'dist'
}

Compress-Archive -Path $items.FullName -DestinationPath $tempZip -CompressionLevel Optimal -Force
Move-Item -Path $tempZip -Destination $zipPath -Force
Write-Host "Successfully replaced $zipPath with updated codebase!"
