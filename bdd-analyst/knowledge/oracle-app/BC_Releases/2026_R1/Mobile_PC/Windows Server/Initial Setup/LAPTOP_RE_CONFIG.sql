spool C:\bcmpc\replication\log\LAPTOP_RE_CONFIG.log

Shutdown immediate

startup

alter profile DEFAULT limit password_life_time UNLIMITED;

alter session set "_ORACLE_SCRIPT"=true;

DROP User LAPTOP CASCADE;

Create User LAPTOP identified by idemerawlaptop default tablespace lt_data;

Alter Table DBADMN.LAPTOP_ID_DETAILS Add (DOWNLOAD_ERROR_FLAG VARCHAR2(1),ERROR_MSG VARCHAR2(1000));

Grant connect,dba to LAPTOP,DBADMN;
Grant unlimited tablespace to laptop;
Grant unlimited tablespace to dbadmn;
Alter user laptop quota unlimited on lt_data;
Alter user dbadmn quota unlimited on lt_data;

GRANT EXECUTE ON UTL_FILE TO LAPTOP,DBADMN;
GRANT EXECUTE ON DBMS_LOCK TO LAPTOP,DBADMN;
GRANT EXECUTE ON DBMS_CRYPTO TO LAPTOP,DBADMN;
GRANT EXECUTE ON DBMS_SQL TO LAPTOP,DBADMN;
GRANT EXECUTE ON UTL_TCP TO LAPTOP,DBADMN;
GRANT EXECUTE ON UTL_SMTP TO LAPTOP,DBADMN;

Grant execute on DBMS_SCHEDULER to laptop,dbadmn; 
Grant execute on DBMS_ISCHED to laptop,dbadmn;
Grant Create Job to laptop,dbadmn;

GRANT ALTER, SELECT ON  DBADMN.AUDIT_SEQ TO LAPTOP;

GRANT ALTER, SELECT ON  DBADMN.NOTE_SEQUENCE TO LAPTOP;

GRANT ALTER, SELECT ON  DBADMN.WEB_ONLINE_ID_SEQ TO LAPTOP;

GRANT ALTER, SELECT ON  DBADMN.EQUIP_SETID_SEQ TO LAPTOP;

GRANT ALTER, SELECT ON  DBADMN.PS_TXN_SEQ TO LAPTOP;

GRANT ALTER, SELECT ON  DBADMN.SURVEY_SEQUENCE TO LAPTOP;

GRANT ALTER,SELECT ON  DBADMN.FTRAK_ONLINE_ID_SEQ TO LAPTOP;

Grant select,insert,update on DBADMN.LAPTOP_ID_DETAILS to LAPTOP;

Grant select,insert,update on DBADMN.DONOR_CARD_PARM to LAPTOP;


@C:\bcmpc\replication\webutil_db.sql

Create or replace directory UTL_DIR as 'C:\bcmpc\extract';

Grant read,write,execute on Directory UTL_DIR to laptop,dbadmn;

Create Or Replace Directory LOGDR as 'C:\bcmpc\reports';

Grant Read,Write,execute on directory LOGDR to laptop,dbadmn;

Create or replace directory MOBDMP as 'C:\bcmpc\replication';

Grant read,write,execute on Directory MOBDMP to laptop,dbadmn;

Create or replace directory MOBDMP_ARCH as 'C:\bcmpc\replication\archive_dump';

Grant read,write,execute on Directory MOBDMP_ARCH to laptop,dbadmn;

Create or replace directory EXT_ARCH as 'C:\bcmpc\extract\archive';

Grant read,write,execute on Directory EXT_ARCH to laptop,dbadmn;


shutdown immediate

startup

exit;
