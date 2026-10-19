# Below is locking for long running Jobs
let count=0
while test $count -lt 4
do
   let count=count+1
   echo $count

if [ -f /lifetrk/scripts/TUBE_CHECKIN_API.lock ]
then
   echo " ... previous Job is still running ..."
   exit
else
   touch /lifetrk/scripts/TUBE_CHECKIN_API.lock
fi

export DATABASE=ptrak
export LABSCRIPTS=/lifetrak/scripts
export LABEXEC=/home/lifetrak/lab/frmx
export LABLOGDIR=/home/sbcsys/log
export PATH=$PATH:/usr/local/bin:$LABSCRIPTS:$LABEXEC:.:$HOME
export ORACLE_HOME=/apps/product/12.2.0/dbhome_1
export ORACLE_PATH=$ORACLE_HOME:$LABSCRIPTS:$LABEXEC
export ORACLE_SID=$DATABASE
export ORAENV_ASK=NO
. /usr/local/bin/oraenv
. $LABSCRIPTS/connect_db
export SESSION_ID=`date +%Y%m%d%H%M%S`

sqlplus $APICONNECT @$LABSCRIPTS/api_tube_checkin.sql

rm /lifetrk/scripts/TUBE_CHECKIN_API.lock


if [ $count -lt 4 ]
   then
      sleep 15
   fi
done

