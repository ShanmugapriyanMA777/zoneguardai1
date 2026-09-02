@echo off
setlocal
echo ========================================================
echo  Building ZoneGuard AI Field Officer Android APK
echo ========================================================

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"

cd /d "%~dp0"
echo [*] Step 1: Building production web assets...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed.
    exit /b 1
)

echo [*] Step 2: Syncing Capacitor Android assets...
call npx.cmd cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    exit /b 1
)

echo [*] Step 3: Compiling Debug APK via Gradle...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gradle build failed.
    exit /b 1
)

cd /d "%~dp0"
echo [*] Step 4: Deploying APK to workspace root and Downloads...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "..\ZoneGuard-FieldOps.apk"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "%USERPROFILE%\Downloads\ZoneGuard-FieldOps.apk"

echo ========================================================
echo  [SUCCESS] APK Built and Deployed Successfully!
echo  APK Location (Workspace): ZoneGuard-FieldOps.apk
echo  APK Location (Android):   field-portal\android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
exit /b 0


