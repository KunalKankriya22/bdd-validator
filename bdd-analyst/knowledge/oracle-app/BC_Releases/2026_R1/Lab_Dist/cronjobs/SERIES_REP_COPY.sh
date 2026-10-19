PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

export prtime=`date +%m%d%y%H%M%S`
sqlplus -s util/util @/home/sbcsys/bcqas/labexec/SERIES_REP_COPY.sql /home/sbcsys/bcqas/SERIES_REPORTS/$prtime

#mv /home/sbcsys/$prtime.lst /home/sbcsys/qtrak/labexec
#chmod +x /home/sbcsys/qtrak/labexec/$prtime.lst
chmod +x /home/sbcsys/bcqas/SERIES_REPORTS/$prtime.lst
#sh /home/sbcsys/qtrak/labexec/$prtime.lst
sh /home/sbcsys/bcqas/SERIES_REPORTS/$prtime.lst
sleep 10
rm /home/sbcsys/bcqas/SERIES_REPORTS/$prtime.lst

