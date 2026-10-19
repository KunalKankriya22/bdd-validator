SET PATH=C:\Program Files (x86)\WinSCP;%PATH%

winscp.com /script=C:\bcmpc\replication\start_download_dmp_sftp_refresh.txt

start cmd /c C:\bcmpc\replication\download.bat


