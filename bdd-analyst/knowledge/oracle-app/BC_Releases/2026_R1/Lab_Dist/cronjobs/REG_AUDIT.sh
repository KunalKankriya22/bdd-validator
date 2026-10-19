PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. /usr/local/bin/oraenv

SESSION_ID=`date +%m%d%y%H%M%S`
export SESSION_ID
cd /home/sbcsys/bcqas/log/daily
sqlplus sbcsys/sbcsys @submit_audit_interface.sql
rm -f reg_audit_report.lst
sqlplus sbcsys/sbcsys @reg_audit_report.sql
#lp -oc -d de_xfr reg_audit_report.lst
mv reg_audit_report.lst $SESSION_ID.prior_abo

