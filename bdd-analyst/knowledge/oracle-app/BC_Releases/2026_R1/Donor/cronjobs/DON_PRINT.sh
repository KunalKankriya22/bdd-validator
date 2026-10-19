export FTPGETFROM=/home/reports/
#export USERCODE=connect_donor.sql
export USERCODE=donsys/donsys
# export MACHINENAME=ftpsrv   # server is dalfarm01
#export MACHINENAME=dlapp01    # Reports server is located here 5/31/2000 csw
#export MACHINENAME2=bfftpsrv
#export MACHINENAME3=172.16.10.74
export PATH=$PATH:/usr/local/bin
for ORACLE_SID in bcqas
do
export ORACLE_SID
export ORAENV_ASK=NO
. oraenv
cd /home/donsys/bcqas/donorexec
export prtime=`date +%m%d%y%H%M%S`
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
	sqlplus -s $USERCODE \@DON_PRINT.sql $prtime  
chmod +x $prtime.lst
sh ./$prtime.lst
rm $prtime.lst
fi
done
