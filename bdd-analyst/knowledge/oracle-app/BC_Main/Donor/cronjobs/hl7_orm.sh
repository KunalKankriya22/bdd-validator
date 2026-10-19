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
execute HL7_DONOR_INTERFACE.GENERATE_HEMOGRAM_ORM;
exit
!
cd /tmp/bcqas_util
for i in HL7HEMO*.dat
do
vfilesize=`ls -lt $i | cut -c37-42`
if [ $vfilesize -ne 0 ]
then
cp $i /home/donsys/bcqas/hl7/orders
fi
done
sleep 8
#rm HL7HEMO*.dat
done

