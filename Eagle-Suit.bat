@echo off
REM ===============================================================
REM  Eagle Suit ERP - Offline Local Launcher
REM  Opens the system in Chrome/Edge app mode (no address bar).
REM  Works with no internet connection.
REM ===============================================================
title Eagle Suit ERP
set "APPDIR=%~dp0"
set "URL=file:///%APPDIR:\=/%index.html"

REM --- try Google Chrome ---
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" --app="%URL%" --window-size=1400,900 --allow-file-access-from-files
  exit /b
)

REM --- fall back to Microsoft Edge ---
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" --app="%URL%" --window-size=1400,900 --allow-file-access-from-files
  exit /b
)

REM --- last resort: default browser ---
start "" "%APPDIR%index.html"
