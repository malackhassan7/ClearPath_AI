@echo off
setlocal
cd /d "%~dp0"
echo.
echo  CLEARPATH AI / SIH 26130 - Unified Platform Launcher
echo  -----------------------------------------
where node >nul 2>nul || (echo ERROR: Node.js is not installed. Install Node.js 20+ and retry.& pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm was not found. Reinstall Node.js with npm included.& pause & exit /b 1)
if not exist node_modules\vite\bin\vite.js (
  echo Installing dependencies. This takes a moment on first run...
  call npm install
  if errorlevel 1 (echo ERROR: npm install failed. Check internet access and the npm error above.& pause & exit /b 1)
)
call npm run dev:full
if errorlevel 1 echo CLEARPATH AI / SIH 26130 stopped with an error. Review the messages above.
pause
