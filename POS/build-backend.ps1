# Build script for all backend microservices

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Alwon POS Backend Microservices" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$services = @(
    "api-gateway",
    "session-service",
    "cart-service",
    "product-service",
    "payment-service",
    "camera-service",
    "access-service",
    "inventory-service",
    "websocket-server"
)

$failedBuilds = @()

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    
    Push-Location "backend\$service"
    
    $result = mvn clean package -DskipTests
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $service built successfully`n" -ForegroundColor Green
    } else {
        Write-Host "✗ $service build failed`n" -ForegroundColor Red
        $failedBuilds += $service
    }
    
    Pop-Location
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($failedBuilds.Count -eq 0) {
    Write-Host "All services built successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed builds:" -ForegroundColor Red
    $failedBuilds | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
Write-Host "========================================" -ForegroundColor Cyan
