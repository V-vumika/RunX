@echo off
echo last run: %DATE% %TIME%> "C:\Users\shivk\OneDrive\Desktop\RunX\.commitflow\last-run.txt"
cd /d "C:\Users\shivk\OneDrive\Desktop\RunX"
"C:\Program Files\nodejs\node.exe" "C:\Users\shivk\OneDrive\Desktop\CommitFlow\dist\cli\index.js" start --once
