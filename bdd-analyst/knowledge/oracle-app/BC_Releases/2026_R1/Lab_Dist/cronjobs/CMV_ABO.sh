PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. /usr/local/bin/oraenv
SESSION_ID=`date +%m%d%y%H%M%S`
export SESSION_ID
cd /home/sbcsys/bcqas/log/daily
sqlplus sbcsys/sbcsys @submit_cmv_interface.sql
rm -f cmv_interface.lst
#sqlplus / @prior_cmv_report.sql
#lp -oc -d de_xfr cmv_interface.lst
mv cmv_interface.lst $SESSION_ID.cmv_interface

