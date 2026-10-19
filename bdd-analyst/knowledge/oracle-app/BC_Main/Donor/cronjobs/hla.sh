export PATH=$PATH:/usr/local/bin
export ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec
export ORAENV_ASK=NO
for ORACLE_SID in bcqas
do
export ORACLE_SID
ORAENV_ASK=NO
. oraenv
USERCODE=donsys/donsys
sqlplus -s $USERCODE <<!
execute don_hla_rbc.hlarbc_proc_caller;
exit
!
done

