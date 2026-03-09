# Step 1: Login to get session cookie
$loginBody = '{"email":"admin@example.com","password":"password"}'
$loginResponse = Invoke-WebRequest -Method POST -Uri 'http://localhost:3000/api/auth/login' `
    -ContentType 'application/json' -Body $loginBody -UseBasicParsing -SessionVariable session

Write-Host "Login status: $($loginResponse.StatusCode)"

# Step 2: Call engine run with the session
$engineResponse = Invoke-WebRequest -Method POST -Uri 'http://localhost:3000/api/engine/run' `
    -ContentType 'application/json' -Body '{}' -UseBasicParsing -WebSession $session

Write-Host "Engine status: $($engineResponse.StatusCode)"
Write-Host "Engine body: $($engineResponse.Content)"
