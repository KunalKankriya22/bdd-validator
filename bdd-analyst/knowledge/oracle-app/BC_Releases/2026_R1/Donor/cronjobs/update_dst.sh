#!/bin/ksh
# This shell is started by cron process oracle.ctab to automatically
# Run the Enlistment server
#

PATH=$PATH:/usr/local/bin
for ORACLE_SID in BCSQA
do
export ORACLE_SID
ORAENV_ASK=NO
. oraenv
cd /home/donsys/bcsqa/donorexec
sqlplus donsys/donsys @update_dst.sql
if [ $? -eq 0 ]
then
     COMPL="completed"
else
     COMPL="aborted"
fi;
done

 
