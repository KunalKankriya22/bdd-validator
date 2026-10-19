PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

sqlplus -s util/util @/home/sbcsys/bcqas/labexec/schedule_REPORT.sql

