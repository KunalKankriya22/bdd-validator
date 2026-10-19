@echo off
REM BC_Agents Production Deployment Script for Windows
REM This script creates a production-ready package excluding development files

echo === BC_Agents Production Deployment Script ===
echo Creating production package...

REM Set variables
set PROD_DIR=bc_agents_production
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set BACKUP_NAME=bc_agents_prod_%TIMESTAMP%.zip

REM Clean up any existing production directory
if exist "%PROD_DIR%" (
    echo Removing existing production directory...
    rmdir /s /q "%PROD_DIR%"
)

REM Create production directory structure
echo Creating production directory structure...
mkdir "%PROD_DIR%"
mkdir "%PROD_DIR%\settings"
mkdir "%PROD_DIR%\shared"
mkdir "%PROD_DIR%\bconsiteagentapp"
mkdir "%PROD_DIR%\bcoracleagentapp"
mkdir "%PROD_DIR%\logs"
mkdir "%PROD_DIR%\tmp"

REM Copy essential files
echo Copying production files...

REM Root level files
copy ".env.prod" "%PROD_DIR%\"
copy ".htaccess" "%PROD_DIR%\"
copy "README.md" "%PROD_DIR%\"

REM Application directories
xcopy "settings" "%PROD_DIR%\settings" /E /I /Y
xcopy "shared" "%PROD_DIR%\shared" /E /I /Y
xcopy "bconsiteagentapp" "%PROD_DIR%\bconsiteagentapp" /E /I /Y
xcopy "bcoracleagentapp" "%PROD_DIR%\bcoracleagentapp" /E /I /Y

REM Set production environment in .htaccess
echo Configuring production environment...
powershell -Command "(gc '%PROD_DIR%\.htaccess') -replace 'SetEnv APP_ENV .*', 'SetEnv APP_ENV prod' | Out-File -encoding ASCII '%PROD_DIR%\.htaccess'"

REM Create .gitignore for production
echo # Production .gitignore > "%PROD_DIR%\.gitignore"
echo logs/*.log >> "%PROD_DIR%\.gitignore"
echo tmp/* >> "%PROD_DIR%\.gitignore"
echo !logs/.gitkeep >> "%PROD_DIR%\.gitignore"
echo !tmp/.gitkeep >> "%PROD_DIR%\.gitignore"
echo .env.dev >> "%PROD_DIR%\.gitignore"
echo .env.qa >> "%PROD_DIR%\.gitignore"
echo docs/ >> "%PROD_DIR%\.gitignore"
echo tests/ >> "%PROD_DIR%\.gitignore"
echo apache_php_config/ >> "%PROD_DIR%\.gitignore"

REM Create placeholder files
echo. > "%PROD_DIR%\logs\.gitkeep"
echo. > "%PROD_DIR%\tmp\.gitkeep"

REM Create deployment archive (requires PowerShell)
echo Creating deployment archive...
powershell -Command "Compress-Archive -Path '%PROD_DIR%' -DestinationPath '%BACKUP_NAME%' -Force"

REM Display summary
echo.
echo === Production Package Created ===
echo Directory: %PROD_DIR%
echo Archive: %BACKUP_NAME%
echo.
echo Files included:
dir /s /b "%PROD_DIR%"
echo.
echo Files excluded (not in production):
echo   - docs/ (documentation)
echo   - tests/ (test scripts)
echo   - .env.dev, .env.qa (development environments)
echo   - apache_php_config/ (server configuration)
echo.
echo === Deployment Instructions ===
echo 1. Upload %BACKUP_NAME% to your production server
echo 2. Extract the archive
echo 3. Move to web directory: move %PROD_DIR% /var/www/html/cac
echo 4. Set ownership: chown -R www-data:www-data /var/www/html/cac
echo 5. Update database credentials in .env.prod
echo 6. Test the deployment
echo.
echo Production package ready for deployment!
pause
