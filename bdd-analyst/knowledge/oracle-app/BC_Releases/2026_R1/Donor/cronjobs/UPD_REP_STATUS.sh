# Below is locking for long running Jobs

let count=0
while test $count -lt 4 
do
   let count=count+1
   echo $count

if [ -f /home/donsys/bcqas/donorexec/UPD_REP_STATUS.lock ]
then
   echo " ... previous Job is still running ..."
   exit
else
   touch /home/donsys/bcqas/donorexec/UPD_REP_STATUS.lock
fi

PATH=$PATH:/usr/local/bin:/home/donsys/bcqas/donorexec; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec; export ORACLE_PATH
ORACLE_SID=bcqas; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK

. /usr/local/bin/oraenv

sqlplus -s util/util @/home/donsys/bcqas/donorexec/UPD_REP_STATUS.sql

rm /home/donsys/bcqas/donorexec/UPD_REP_STATUS.lock

if [ $count -lt 4 ]
   then
      sleep 15
   fi
done



