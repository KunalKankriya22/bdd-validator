#!/bin/bash

ORAENV_ASK='NO'
ORACLE_SID=FREE
. oraenv
ORAENV_ASK=''
sqlplus / as sysdba <<EOF
alter pluggable database FREEPDB1 save state;
alter session set container = FREEPDB1;
CREATE USER vector IDENTIFIED BY vector;
grant dba to vector;
create directory VEC_DUMP as '/home/oracle/labs';
grant read,write on directory VEC_DUMP to vector;
exit;
EOF
