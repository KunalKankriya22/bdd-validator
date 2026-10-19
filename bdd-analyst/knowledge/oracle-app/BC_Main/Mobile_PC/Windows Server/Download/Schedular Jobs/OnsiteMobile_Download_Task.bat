@echo off 
IF EXIST "C:\bcmpc\replication\download.hdr" (
    echo 'File EXIST!'
move /Y C:\bcmpc\replication\download.hdr C:\bcmpc\replication\archive_dump\
C:\bcmpc\replication\download.bat
) ELSE (
    echo 'File missing!'
)