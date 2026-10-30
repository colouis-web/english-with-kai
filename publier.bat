@echo off
rem ============================================================
rem  Publier Learning English with Kai : double-cliquez ici.
rem  Le vrai travail est fait par publier.ps1 (meme dossier).
rem  Aucun droit administrateur necessaire.
rem ============================================================
where powershell >nul 2>nul
if errorlevel 1 (
  echo PowerShell est introuvable sur cet ordinateur.
  echo Utilisez GitHub Desktop pour publier : voir PUBLIER.md, plan B.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publier.ps1"
rem publier.ps1 renvoie 0 (publie ou rien a faire) ou 10 (echec explique a l'ecran).
rem Tout autre code : le script n'a pas pu se lancer (souvent bloque par l'informatique du bureau).
if errorlevel 10 exit /b 1
if errorlevel 1 (
  echo.
  echo Le script de publication n'a pas pu demarrer sur cet ordinateur
  echo ^(PowerShell est peut-etre bloque par le service informatique^).
  echo Utilisez GitHub Desktop pour publier : voir PUBLIER.md, plan B.
  pause
  exit /b 1
)
exit /b 0
