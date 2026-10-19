PATH=/usr/local/bin:$PATH:/home/sbcsys/bcqas/labexec/EMFUTIL:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec/EMFUTIL;export ORACLE_PATH
sqlplus util/util @/home/sbcsys/bcqas/labexec/EMFUTIL/EMFUTIL_RECHECK_DONOR.sql

