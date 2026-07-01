@echo off
title artGRANIT - Plan Instruire
cd /d "%~dp0"

echo.
echo  artGRANIT - Pornire aplicatie...
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  EROARE: Node.js nu este instalat.
  echo  Descarcati de la https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  Instalare dependinte...
  call npm install
)

echo  Generare resurse (iconite + documente)...
call npm run setup

echo  Deschidere browser...
start "" "http://localhost:5173/login"

echo  Pornire server (nu inchide aceasta fereastra)...
echo  Adresa: http://localhost:5173
echo.
call npm run dev
