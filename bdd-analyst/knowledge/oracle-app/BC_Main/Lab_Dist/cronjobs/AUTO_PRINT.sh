
# Below is locking for long printing Jobs
let count=0
while test $count -lt 4
do
   let count=count+1
   echo $count

if [ -f /home/sbcsys/bcqas/labexec/AUTO_PRINT.lock ]
then
   echo " ... previous Job is still running ..."
   exit
else
   touch /home/sbcsys/bcqas/labexec/AUTO_PRINT.lock
fi


export USERCODE=sbcsys/sbcsys
export PATH=$PATH:/usr/local/bin
for ORACLE_SID in bcqas
do
export ORACLE_SID
export ORAENV_ASK=NO
. oraenv
cd /home/sbcsys/bcqas/labexec
export prtime=`date +%m%d%y%H%M%S`
echo `date`
tmp=`
sqlplus -s $USERCODE <<!
set heading off
set pages 0
set feedback off
set verify off
set echo on
set flush off
set trimspool on
set embedded on
select count(*) from print_request_queue;
exit
!
`
echo $tmp
if [ $tmp -eq 0 ] 
then
   sleep 10
else
	sqlplus -s $USERCODE \@AUTO_PRINT.sql $prtime  
chmod +x $prtime.lst
sh ./$prtime.lst
#rm $prtime.lst
fi
done

rm /home/sbcsys/bcqas/labexec/AUTO_PRINT.lock


if [ $count -lt 4 ]
   then
      sleep 5
   fi
done

