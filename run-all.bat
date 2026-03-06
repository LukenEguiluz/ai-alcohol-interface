@echo off
title AI Alcohol - Launcher
cd /d "%~dp0"

if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
)

echo Iniciando Backend (Django)...
start "AI Alcohol - Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python manage.py runserver"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend (React)...
start "AI Alcohol - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Cierra las ventanas de Backend y Frontend para detener los servidores.
pause
