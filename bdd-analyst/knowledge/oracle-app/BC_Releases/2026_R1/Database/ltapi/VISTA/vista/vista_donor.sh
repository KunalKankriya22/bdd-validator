export PATH=$PATH:/usr/local/bin
export ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec
UTIL_DIR=/tmp/bcqas_util
export ORAENV_ASK=NO
for ORACLE_SID in bcqas
do
export ORACLE_SID
ORAENV_ASK=NO
. oraenv
USERCODE=vista/vista
sqlplus donsys/donsys @connect_vista.sql <<!
execute lt_idp_feed.process_vista_donors('PIPE');
exit
!
cd /tmp/bcqas_util
for i in donor_tr*.DNR
do
vfilesize=`ls -lt $i | cut -c25-28`
if [ $vfilesize -ne 0 ]
then
cp $i /home/donsys/bcqas/vista/send
mv $i $i.sent
fi
done
sleep 8
#rm donor_tr*.DNR
done

