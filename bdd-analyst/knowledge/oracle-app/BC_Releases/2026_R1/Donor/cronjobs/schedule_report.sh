PATH=$PATH:/usr/local/bin:/home/donsys/bcsqa/donorexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcsqa/donorexec; export ORACLE_PATH
ORACLE_SID=BCSQA; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

#cd /home/donsys/reports

sqlplus -s util/util @/home/donsys/bcsqa/donorexec/schedule_REPORT.sql

