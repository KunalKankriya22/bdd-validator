
@echo off
setlocal enabledelayedexpansion
REM Folder where this BAT lives (will be c:\Program Files\BC2026\ after install)
set "BASEDIR=%~dp0"
REM Update below variables based on the environment.
REM ----
SET hostname=http://10.155.194.227:9001
SET jar=%BASEDIR%frmsal.jar
SET config=bcorapp
SET protocol=bcapp2026r1-qasdb
REM ----
SET param1=%1
REM Invokes the batch script directly without any parameters.
IF "%param1%"=="" (
    SET "url=%hostname%/forms/frmservlet?config=%config%"
) ELSE (
    REM Extract ID from PROTOCOL://ID or PROTOCOL://ID/
    REM CALL with delayed expansion (!variable!) to force the batch processor 
    REM to evaluate the variable content before performing the string substitution.
    CALL SET Up2Sub=%%param1:!protocol!://=%%
    REM Remove trailing slash if present (only if Up2Sub is not empty)
    IF "!Up2Sub!"=="" (
        SET "SubStr="
    ) ELSE (
        SET "SubStr=!Up2Sub:/=!"
    )
    IF "!SubStr!"=="" (
        SET "url=%hostname%/forms/frmservlet?config=%config%"
    ) ELSE (
        SET "url=%hostname%/forms/frmservlet?config=%config%&p_uid_key=!SubStr!"
    )
    
)
REM Run Java (quote paths because Program Files has spaces)
"%BASEDIR%jdk-21\bin\javaw.exe" -Dsun.java2d.uiScale=1.0 -Xms512m -Xmx2G -jar "%jar%" -url "%url%" -t 30000 -showConfig true
endlocal
