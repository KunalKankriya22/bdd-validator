set path="C:\Program Files\7-Zip";%path%
cd C:\bcmpc\replication
7z -y e CENTRAL_NOTES.dmp.gz > nul
7z -y e DONATION_INTERDICTIONS.dmp.gz > nul
7z -y e DONOR_COMMUNICATIONS.dmp.gz > nul
7z -y e DONOR_PICTURES.dmp.gz > nul
7z -y e HEALTH_HISTORY.dmp.gz > nul
7z -y e ONLINE_STATUS.dmp.gz > nul
7z -y e DONATION_ATTRIBUTES.dmp.gz > nul
7z -y e DONATIONS.dmp.gz > nul
7z -y e DONOR_INTERDICTIONS.dmp.gz > nul
7z -y e DRIVES.dmp.gz > nul
7z -y e ltmpc.dmp.gz > nul
7z -y e PHYSICAL_FINDINGS.dmp.gz > nul

SET ORACLE_HOME=C:\app\oracle\product\18.0.0\dbhomeXE
SET PATH=C:\app\oracle\product\18.0.0\dbhomeXE\bin;%PATH%;
SET ORACLE_SID=xe

sqlplus laptop/idemerawlaptop @C:\bcmpc\replication\Delete_Laptop_Data.sql

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=ltmpc.dmp logfile=imp_ltmpc.log REMAP_SCHEMA=donsys:laptop,sbcsys:laptop,ltweb:laptop,util:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=CENTRAL_NOTES.dmp logfile=imp_CENTRAL_NOTES.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONATION_ATTRIBUTES.dmp logfile=imp_DONATION_ATTRIBUTES.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONATION_INTERDICTIONS.dmp logfile=imp_DONATION_INTERDICTIONS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONOR_INTERDICTIONS.dmp logfile=imp_DONOR_INTERDICTIONS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONATIONS.dmp logfile=imp_DONATIONS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONOR_COMMUNICATIONS.dmp logfile=imp_DONOR_COMMUNICATIONS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DRIVES.dmp logfile=imp_DRIVES.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=HEALTH_HISTORY.dmp logfile=imp_HEALTH_HISTORY.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=ONLINE_STATUS.dmp logfile=imp_ONLINE_STATUS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=PHYSICAL_FINDINGS.dmp logfile=imp_PHYSICAL_FINDINGS.log REMAP_SCHEMA=donsys:laptop content=data_only

impdp laptop/idemerawlaptop directory=MOBDMP dumpfile=DONOR_PICTURES.dmp logfile=imp_DONOR_PICTURES.log REMAP_SCHEMA=donsys:laptop content=data_only


sqlplus laptop/idemerawlaptop @C:\bcmpc\replication\Update_Laptop_data.sql

del C:\bcmpc\replication\log\import_error.log

findstr /spin /c:"error(s)" C:\bcmpc\replication\imp*.log > C:\bcmpc\replication\log\import_error.log

echo "Download process Completed, Please check if any errors below " >> C:\bcmpc\replication\log\import_error.log

C:\Windows\System32\icacls.exe "C:\bcmpc\replication\*.gz" /grant:r Users:(OI)(CI)F /T 

move /Y C:\bcmpc\replication\*.gz C:\bcmpc\replication\archive_dump\
move /Y C:\bcmpc\replication\*.dmp C:\bcmpc\replication\archive_dump\
move /Y C:\bcmpc\replication\imp_*.log C:\bcmpc\replication\archive_dump\


Exit

