export LABSCRIPTS=/home/sbcsys/bcqas/labexec
export LABEXEC=/home/sbcsys/bcqas/labexec
export LABLOGDIR=/tmp/bcqas_util
export PATH=$PATH:/usr/local/bin:$LABSCRIPTS:$LABEXEC
export ORACLE_SID=bcqas
export UTIL_FILE_DIR=/tmp/bcqas_util
export ORAENV_ASK=NO
. /usr/local/bin/oraenv
export ORACLE_PATH=$ORACLE_PATH:$LABSCRIPTS:$LABEXEC
cd $LABLOGDIR
echo "Running at `date`..."
rm -f reset_numbers.lst;
sqlplus sbcsys/sbcsys <<!
set serveroutput on;
spool reset_numbers.lst;
start reset_numbers.sql;
spool off;
exit;
!
