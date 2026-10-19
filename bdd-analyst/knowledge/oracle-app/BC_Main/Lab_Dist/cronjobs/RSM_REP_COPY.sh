PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

export prtime=`date +%m%d%y%H%M%S`
sqlplus -s util/util @/home/sbcsys/bcqas/labexec/RSM_REP_COPY.sql $prtime

mv /home/sbcsys/$prtime.lst /home/sbcsys/bcqas/labexec
chmod +x /home/sbcsys/bcqas/labexec/$prtime.lst
sh /home/sbcsys/bcqas/labexec/$prtime.lst
sleep 10
rm /home/sbcsys/bcqas/labexec/$prtime.lst

