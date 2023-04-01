mkdir 'v0.1'
Set-Location 'v0.1'
mkdir win-x64
mkdir linux-x64
mkdir macos-x64
mkdir linux-arm64
mkdir vscode

# Building the Assembler
cd..
Set-Location .\assembly\assembler\
npm run build
npx pkg -t node18-linux-x64, node18-macos-x64, node18-win-x64, node18-linux-arm64, node18-win-arm64, node18-macos-arm64 index.js
Rename-Item index-linux-x64 assembler
Move-Item assembler ..\..\v0.1\linux-x64\
Rename-Item index-linux-arm64 assembler
Move-Item assembler ..\..\v0.1\linux-arm64\
Rename-Item index-win-x64.exe assembler.exe
Move-Item assembler.exe ..\..\v0.1\win-x64/
Rename-Item index-macos-x64 assembler
Move-Item assembler ..\..\v0.1\macos-x64/

# Building the Disassembler
Set-Location ..\disassembler
npm run build
npx pkg -t node18-linux-x64, node18-macos-x64, node18-win-x64, node18-linux-arm64, node18-win-arm64, node18-macos-arm64 index.js
Rename-Item index-linux-x64 disassembler
Move-Item disassembler ..\..\v0.1\linux-x64\
Rename-Item index-linux-arm64 disassembler
Move-Item disassembler ..\..\v0.1\linux-arm64\
Rename-Item index-win-x64.exe disassembler.exe
Move-Item disassembler.exe ..\..\v0.1\win-x64/
Rename-Item index-macos-x64 disassembler
Move-Item disassembler ..\..\v0.1\macos-x64/

# Building the VSCode extension
Set-Location ..\..\vscode-extension
New-Item ..\v0.1\vscode\INSTALL.txt
Set-Content ..\v0.1\vscode\INSTALL.txt "Copy anc16-assembly folder into:
Windows: %USERPROFILE%\.vscode\extensions
Linux: ~/.vscode/extensions
MacOS: ~/.vscode/extensions"
mkdir ..\v0.1\vscode\anc16-assembly
Copy-Item * ..\v0.1\vscode\anc16-assembly
Copy-Item syntaxes\* ..\v0.1\vscode\anc16-assembly\syntaxes

Set-Location ..\