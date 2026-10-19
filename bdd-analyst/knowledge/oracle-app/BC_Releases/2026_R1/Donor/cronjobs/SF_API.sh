PATH=$PATH:/usr/local/bin:/home/donsys/bcqas/donorexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

sqlplus -s util/util @/home/donsys/bcqas/donorexec/SF_API.sql


