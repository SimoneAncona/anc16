npx pkg -t node18-linux-x64, node18-macos-x64, node18-win-x64, node18-linux-arm64, node18-win-arm64, node18-macos-arm64 index.js
mkdir 'v0.1'
Set-Location 'v0.1'
mkdir win-x64
mkdir linux-x64
mkdir macos-x64
mkdir linux-arm64
Rename-Item ..\index-linux-x64 assembler
Move-Item ..\assembler linux-x64/
Rename-Item ..\index-linux-arm64 assembler
Move-Item ..\assembler linux-arm64/
Rename-Item ..\index-win-x64.exe assembler.exe
Move-Item ..\assembler.exe win-x64/
Rename-Item ..\index-macos-x64 assembler
Move-Item ..\assembler macos-x64/