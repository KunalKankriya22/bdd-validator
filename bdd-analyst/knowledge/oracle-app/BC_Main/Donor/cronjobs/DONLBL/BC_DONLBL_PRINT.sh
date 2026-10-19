########################################################################
# Shell to Print Labels and Delete Enteries                            #
########################################################################
export PATH=/usr/kerberos/sbin:/usr/kerberos/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/bin:/bin:/root/bin:/usr/local/bin:/apps/product:/home/donsys/bcqas/DONREP
export ORACLE_BASE=/apps/product
export ORACLE_HOME=/apps/product/19.0.0/dbhome_1
export ORACLE_SID=bcqas
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/tmp/bcqas_util:/home/donsys/bcqas/DONLBL:/home/donsys/bcqas/DONREP;export ORACLE_PATH
#export ORACLE_TERM=xterm
#export NLS_LANG=AMERICAN
#EXEC=/home/donsys/qtrak/DONLBL; export EXEC
#OUTP=/home/donsys/qtrak/DONREP; export OUTP
cd /home/donsys/bcqas/DONREP
while true
do
sqlplus -s donsys/donsys@bcqas <<!
set feedback off
set echo off
set verify off
set lines 132
set heading off
spool /home/donsys/bcqas/DONREP/lcmd_list.sh
@/home/donsys/bcqas/DONLBL/BC_DONLBL_PRINT.sql /home/donsys/bcqas/DONREP
spool off
exit
!
if test -s lcmd_list.sh
then
exec 0< /home/donsys/bcqas/DONREP/lcmd_list.sh
while
   read cmd
   test -n "$cmd"
do
   eval $cmd #execute command
done
fi
#rm /home/donsys/bcqas/DONREP/lcmd_list.sh
sleep 15
done
exit

