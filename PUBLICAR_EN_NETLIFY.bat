@echo off
title Publicar Invitacion en Netlify - Sistemas Lira
color 0b
cls
echo ====================================================================
echo   PUBLICADOR EN NETLIFY - INVITACION LUZ Y EMMANUEL
echo   Equipo Netlify: https://app.netlify.com/teams/pepe-800/projects
echo   Repositorio:    https://github.com/pepe-800/boda_luz_y_emmanuel
echo ====================================================================
echo.
echo Metodo 1: Importar desde GitHub en tu panel Netlify
echo Metodo 2: Netlify Drop (Arrastrar y Soltar)
echo.
echo Abriendo Netlify y la carpeta del proyecto...
start https://app.netlify.com/teams/pepe-800/projects
start https://app.netlify.com/drop
start explorer.exe "%~dp0"
echo.
echo [OK] Paginas abiertas. Puedes arrastrar la carpeta a Netlify Drop
echo      o importar el repositorio "boda_luz_y_emmanuel".
echo.
pause
