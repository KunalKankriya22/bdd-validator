export PATH=$PATH:/usr/local/bin:/home/sbcsys:/home/sbcsys/bcqas/labexec
export ORACLE_PATH=/home/sbcsys/bcqas/labexec:/apps/product/19.0.0/dbhome_1/bin
export ORACLE_SID=bcqas
ORAENV_ASK=NO
. /usr/local/bin/oraenv
echo "Oracle SID is $ORACLE_SID "
sqlplus -s sbcsys/sbcsys @/home/sbcsys/bcqas/labexec/labclean.sql

