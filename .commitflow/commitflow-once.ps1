Set-Content -Path "C:\Users\shivk\OneDrive\Desktop\RunX\.commitflow\last-run.txt" -Value ("last run: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Set-Location "C:\Users\shivk\OneDrive\Desktop\RunX"
& "C:\Program Files\nodejs\node.exe" "C:\Users\shivk\OneDrive\Desktop\CommitFlow\dist\cli\index.js" start --once
