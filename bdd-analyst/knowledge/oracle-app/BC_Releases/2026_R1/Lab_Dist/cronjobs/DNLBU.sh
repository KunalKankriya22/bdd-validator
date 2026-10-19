PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO
. /usr/local/bin/oraenv

SESSION_ID=`date +%m%d%y%H%M%S`
export LABLOGDIR=/home/sbcsys/bcqas/log
export SESSION_ID
cd /home/sbcsys/bcqas/log/daily
sqlplus sbcsys/sbcsys @submit_prior_abo_interface.sql
rm -f prior_abo_report.lst
#sqlplus / @prior_abo_report.sql
#lp -oc -d de_xfr prior_abo_report.lst
mv prior_abo_report.lst $SESSION_ID.prior_abo
rm $SESSION_ID.prior_abo

