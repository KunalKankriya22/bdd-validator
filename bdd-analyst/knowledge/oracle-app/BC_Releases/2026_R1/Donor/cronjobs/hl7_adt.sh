export PATH=$PATH:/usr/local/bin
export ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec
export ORAENV_ASK=NO
FN=HL7ADT*.dat
for ORACLE_SID in bcqas
do
export ORACLE_SID
ORAENV_ASK=NO
. oraenv
USERCODE=donsys/donsys
sqlplus -s $USERCODE <<!
execute HL7_DONOR_INTERFACE.GENERATE_ADT;
exit
!
cd /tmp/bcqas_util
for i in HL7ADT*.dat
do
	vfilesize=`ls -lt $i | cut -c37-42`
	if  [ $vfilesize -ne 0 ] 
	then
	cp $i /home/donsys/bcqas/hl7/orders
	fi
	done
	sleep 8
#rm HL7ADT*.dat
done

