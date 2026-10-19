SET ORACLE_HOME=C:\app\oracle\product\18.0.0\dbhomeXE
SET PATH=C:\app\oracle\product\18.0.0\dbhomeXE;%PATH%;
SET ORACLE_SID=xe

sqlplus dbadmn/IDEMERAW#$123 @C:\bcmpc\replication\process_extract_queue.sql
