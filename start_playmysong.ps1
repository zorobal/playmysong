   # Script pour lancer les serveurs PlayMySong (Backend et Frontend) en parallèle
   # Version corrigée pour mieux gérer les chemins et les citations dans PowerShell

   # ---- Configuration ----
   $backendPath = "D:\PlayMySong\backend"
   $frontendPath = "D:\PlayMySong\frontend"
   $powershellExe = "powershell.exe" # Assure qu'on utilise bien l'exécutable PowerShell

   # ---- Lancement du Backend ----
   Write-Host "Préparation du lancement du serveur Backend..." -ForegroundColor Cyan
   # Utilisation de '& {}' (call operator) pour exécuter la commande à l'intérieur d'un bloc de script
   # Les chemins sont entourés de guillemets doubles pour gérer les espaces potentiels (bien que pas dans cet exemple)
   # Les guillemets simples internes sont conservés pour Set-Location car c'est une commande PowerShell standard.
   $backendCommand = "Set-Location '$backendPath'; npm run dev"
   Start-Process $powershellExe -ArgumentList "-NoExit", "-Command", "& {$backendCommand}"

   # ---- Lancement du Frontend ----
   Write-Host "Préparation du lancement du serveur Frontend..." -ForegroundColor Cyan
   $frontendCommand = "Set-Location '$frontendPath'; npm run dev"
   Start-Process $powershellExe -ArgumentList "-NoExit", "-Command", "& {$frontendCommand}"

   Write-Host "Les serveurs backend et frontend ont été lancés dans des fenêtres PowerShell séparées." -ForegroundColor Green
   Write-Host "Gardez ces fenêtres ouvertes pour que les applications restent actives." -ForegroundColor Yellow
