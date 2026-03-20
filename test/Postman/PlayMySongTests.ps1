# Base URL
$baseUrl = "http://localhost:4000"

# --- 1. Login User ---
$userLoginBody = @{
    email = "user@playmysong.local"
    password = "changeme"
} | ConvertTo-Json

$userLoginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $userLoginBody -ContentType "application/json"
$userToken = $userLoginResp.token
Write-Host "User Token:" $userToken

# --- 2. Créer une requête (User) ---
$requestBody = @{
    establishmentId = 1
    youtubeId = "abc123"
    title = "Billie Jean"
    artist = "Michael Jackson"
    durationSec = 240
    message = "Play this classic!"
} | ConvertTo-Json

$requestResp = Invoke-RestMethod -Uri "$baseUrl/request" -Method Post -Body $requestBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $userToken" }
$requestId = $requestResp.requestId
Write-Host "Request created with ID:" $requestId

# --- 3. Login Admin ---
$adminLoginBody = @{
    email = "admin@playmysong.local"
    password = "changeme"
} | ConvertTo-Json

$adminLoginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminLoginResp.token
Write-Host "Admin Token:" $adminToken

# --- 4. Voir requêtes en attente (Admin) ---
$pendingResp = Invoke-RestMethod -Uri "$baseUrl/request/pending" -Method Get -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Pending requests:" ($pendingResp | ConvertTo-Json -Depth 5)

# --- 5. Valider la requête (Admin) ---
$validateResp = Invoke-RestMethod -Uri "$baseUrl/request/$requestId/validate" -Method Post -Headers @{ Authorization = "Bearer $adminToken" }
Write-Host "Validation response:" ($validateResp | ConvertTo-Json)

# --- 6. Playlist courante (Public) ---
$playlistResp = Invoke-RestMethod -Uri "$baseUrl/request/playlist/current?establishmentId=1" -Method Get
Write-Host "Current playlist:" ($playlistResp | ConvertTo-Json -Depth 5)
