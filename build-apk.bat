@echo off
echo Building Folkhart APK...
echo.

echo Step 1: Building web assets...
call npm run build
if errorlevel 1 goto error

echo.
echo Step 2: Syncing to Android...
call npx cap sync android
if errorlevel 1 goto error

echo.
echo Step 3: Building APK...
cd android
call gradlew assembleDebug
if errorlevel 1 goto error

echo.
echo ====================================
echo SUCCESS! APK built successfully!
echo ====================================
echo.
echo APK Location:
echo %cd%\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
goto end

:error
echo.
echo ====================================
echo ERROR: Build failed!
echo ====================================
pause

:end
