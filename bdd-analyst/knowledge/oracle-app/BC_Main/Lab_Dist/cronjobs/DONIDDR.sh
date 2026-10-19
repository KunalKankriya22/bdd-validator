PATH=$PATH:/usr/local/bin:/home/sbcsys/bcqas/labexec; export PATH
ORACLE_PATH=/home/sbcsys/bcqas/labexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; 
. /usr/local/bin/oraenv
#PATH=$PATH:ORACLE_HOME/bin; export PATH
LOGFILENAME=/tmp/`date +DDR_IN%m%d%y%H%M%S.log`
echo "Bringing interdicted unit list from DONOR.  Please wait ..."
cd /home/sbcsys/bcqas/labexec
sqlplus sbcsys/sbcsys @DONIDDR.sql $LOGFILENAME
#lp $LOGFILENAME
rm $LOGFILENAME

