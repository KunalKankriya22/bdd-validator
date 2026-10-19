
SET PATH=C:\Program Files (x86)\WinSCP;%PATH%

winscp.com /script=C:\bcmpc\replication\Start_Upload_Extract_SFTP_Refresh.txt

cd C:\bcmpc\extract

move *.tif C:\bcmpc\extract\archive
move *.enc C:\bcmpc\extract\archive
move *.txt C:\bcmpc\extract\archive
move *.dat C:\bcmpc\extract\archive
move *.log C:\bcmpc\extract\archive
move *.bdr C:\bcmpc\extract\archive
move *.bde C:\bcmpc\extract\archive
move *.hdr C:\bcmpc\extract\archive
move *.zip C:\bcmpc\extract\archive

cd C:\bcmpc\reports

move *.bdr C:\bcmpc\reports\archive
move *.bde C:\bcmpc\reports\archive
move *.log C:\bcmpc\reports\archive



