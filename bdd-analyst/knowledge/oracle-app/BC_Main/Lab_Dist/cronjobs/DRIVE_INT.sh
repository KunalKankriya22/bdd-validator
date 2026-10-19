PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. /usr/local/bin/oraenv

SESSION_ID=`date +%m%d%y%H%M%S`
export SESSION_ID
cd /home/sbcsys/bcqas/log/daily
rm -f drive_report.lst
sqlplus sbcsys/sbcsys @submit_drive_interface.sql
#lp -oc -d de_xfr drive_report.lst
mv drive_report.lst $SESSION_ID.DRIVE_Interface

