########################################################################
# Shell to Print Labels and Delete Enteries                            #
########################################################################
export PATH=/usr/kerberos/sbin:/usr/kerberos/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/bin:/bin:/root/bin:/usr/local/bin:/apps/product:/home/sbcsys/bcqas/AGFILES
export ORACLE_BASE=/apps/product
export ORACLE_HOME=/apps/product/19.0.0/dbhome_1
export ORACLE_SID=bcqas
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/tmp/bcqas_util:/home/sbcsys/bcqas/AGLBL:/home/sbcsys/bcqas/AGFILES;export ORACLE_PATH
#export ORACLE_TERM=xterm
#export NLS_LANG=AMERICAN
#EXEC=/home/donsys/qtrak/DONLBL; export EXEC
#OUTP=/home/donsys/qtrak/DONREP; export OUTP
cd /home/sbcsys/bcqas/AGFILES
while true
do
sqlplus -s sbcsys/sbcsys@bcqas <<!
set feedback off
set echo off
set verify off
set lines 132
set heading off
spool /home/sbcsys/bcqas/AGFILES/lcmd_list.sh
@/home/sbcsys/bcqas/AGLBL/BC_AGLBL_PRINT.sql /home/sbcsys/bcqas/AGFILES
spool off
exit
!
if test -s lcmd_list.sh
then
exec 0< /home/sbcsys/bcqas/AGFILES/lcmd_list.sh
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

