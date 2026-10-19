spool C:\bcmpc\replication\log\Laptop_Config.log

alter profile DEFAULT limit password_life_time UNLIMITED;

Create tablespace lt_data datafile 'C:\app\oracle\product\18.0.0\oradata\XE\lt_data01.dbf' size 1900M autoextend on next 10M;

alter session set "_ORACLE_SCRIPT"=true;

Create User LAPTOP identified by idemerawlaptop default tablespace lt_data;
Create user DBADMN identified by IDEMERAW#$123 default tablespace lt_data;

Grant connect,dba to LAPTOP,DBADMN;
Grant unlimited tablespace to laptop;
Grant unlimited tablespace from dbadmn;
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

@C:\bcmpc\replication\webutil_db.sql
@C:\bcmpc\replication\LAPTOP_ID_DETAILS.sql
@C:\bcmpc\replication\SEQUENCE.sql

Create or replace directory UTL_DIR as 'C:\bcmpc\extract';

Grant read,write on Directory UTL_DIR to laptop,dbadmn;

Create Or Replace Directory LOGDR as 'C:\bcmpc\reports';

Grant Read,Write on directory LOGDR to laptop,dbadmn;

shutdown immediate

startup

exit;
