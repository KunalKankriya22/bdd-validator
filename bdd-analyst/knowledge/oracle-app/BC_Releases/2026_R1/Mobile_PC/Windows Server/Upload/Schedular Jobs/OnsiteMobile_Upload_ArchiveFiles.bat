@echo off
    for /R "C:\bcmpc\replication" %%f in (*.sts) do (
move /Y C:\bcmpc\replication\%%~nf.sts C:\bcmpc\extract\archive
move /Y C:\bcmpc\extract\%%~nf.zip C:\bcmpc\extract\archive
)

