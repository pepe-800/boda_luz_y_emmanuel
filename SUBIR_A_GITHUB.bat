@echo off
title Sincronizar Invitacion Luz y Emmanuel con GitHub (pepe-800)
color 0a
cls
echo ====================================================================
echo   SUBIR INVITACION LUZ Y EMMANUEL A GITHUB
echo   Repositorio: https://github.com/pepe-800/boda_luz_y_emmanuel
echo   Web Online:  https://pepe-800.github.io/boda_luz_y_emmanuel/
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Preparando cambios locales...
git add .

echo [2/3] Creando commit...
git commit -m "Actualizacion invitacion boda Luz y Emmanuel" >nul 2>nul

echo [3/3] Subiendo a GitHub (main)...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo ====================================================================
    echo   [OK] SINCRONIZADO EXITOSAMENTE CON GITHUB
    echo   URL Repo: https://github.com/pepe-800/boda_luz_y_emmanuel
    echo   URL Web:  https://pepe-800.github.io/boda_luz_y_emmanuel/
    echo ====================================================================
) else (
    echo [!] Hubo un detalle al subir. Verifica tu conexion de red.
)
echo.
pause
