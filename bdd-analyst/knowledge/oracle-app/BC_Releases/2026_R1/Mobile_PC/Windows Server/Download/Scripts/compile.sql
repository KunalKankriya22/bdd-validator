Set heading off;
set feedback off;
set echo off;
Set lines 199;
Spool C:\bcmpc\replication\log\compile_invalid.sql
select 'ALTER ' || OBJECT_TYPE || ' ' || OWNER || '.' || OBJECT_NAME || ' COMPILE;' from dba_objects where status = 'INVALID' and owner='LAPTOP' and OBJECT_TYPE not in ('PACKAGE BODY','TYPE','TYPE BODY','SYNONYM');
select 'ALTER PACKAGE ' || OWNER || '.' || OBJECT_NAME || ' COMPILE BODY;' from dba_objects where owner='LAPTOP' and status = 'INVALID' and OBJECT_TYPE='PACKAGE BODY';
Select 'alter public synonym '||object_name||' compile;' From dba_objects Where status <> 'VALID' And owner = 'PUBLIC' And object_type = 'SYNONYM';
spool off;
set heading on;
set echo on;
@C:\bcmpc\replication\log\compile_invalid.sql

exit;
