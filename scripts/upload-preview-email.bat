@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo [一键发布] 目录: %CD%
echo.
node scripts\upload-preview-email.js %*
set EXITCODE=%ERRORLEVEL%
if %EXITCODE% neq 0 exit /b %EXITCODE%
echo.
pause
