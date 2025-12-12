@echo off
REM GACE Netlify Deployment Script for Windows
REM This script helps deploy your GACE application to Netlify

echo.
echo ========================================
echo    GACE Netlify Deployment Script
echo ========================================
echo.

REM Check if netlify CLI is installed
where netlify >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Netlify CLI not found. Installing...
    call npm install -g netlify-cli
)

echo [Step 1] Running production build...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Please fix errors and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Build completed successfully
echo.

echo [Step 2] Checking Netlify authentication...
call netlify status
if %ERRORLEVEL% NEQ 0 (
    call netlify login
)

echo.
echo [Step 3] Deploying to Netlify...
echo Choose deployment type:
echo 1) Production deploy
echo 2) Draft deploy (preview)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo Deploying to production...
    call netlify deploy --prod
) else if "%choice%"=="2" (
    echo Creating draft deploy...
    call netlify deploy
) else (
    echo Invalid choice. Exiting.
    pause
    exit /b 1
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo    Deployment successful!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Test your deployed site
    echo 2. Seed demo data (see NETLIFY_DEPLOYMENT_CHECKLIST.md^)
    echo 3. Test login with demo accounts (demo.expat@gace.demo / Demo123!^)
    echo 4. Verify product tour works
    echo.
    echo Your site is live!
) else (
    echo [ERROR] Deployment failed. Check logs above.
    pause
    exit /b 1
)

pause
