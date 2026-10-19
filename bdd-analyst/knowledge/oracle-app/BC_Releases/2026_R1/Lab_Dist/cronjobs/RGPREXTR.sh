PATH=/usr/local/bin:$PATH/:/home/sbcsys/bcqas/labexec:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec;export ORACLE_PATH
sqlplus /nolog @connect_db.sql <<!
@RGPREXTR.sql 
exit
!
sqlplus -s util/util @/home/sbcsys/bcqas/labexec/schedule_REPORT_RSM.sql


