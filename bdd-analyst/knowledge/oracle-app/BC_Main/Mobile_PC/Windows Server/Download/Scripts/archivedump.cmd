
del C:\bcmpc\replication\log\extract_error.log

echo "Extract process Needed, Dump files archived into C:\bcmpc\replication\archive_dump directory " >> C:\bcmpc\replication\log\extract_error.log

C:\Windows\System32\icacls.exe "C:\bcmpc\replication\*.gz" /grant:r Users:(OI)(CI)F /T 

move /Y C:\bcmpc\replication\*.gz C:\bcmpc\replication\archive_dump\
move /Y C:\bcmpc\replication\*.dmp C:\bcmpc\replication\archive_dump\
move /Y C:\bcmpc\replication\imp_*.log C:\bcmpc\replication\archive_dump\


Exit

