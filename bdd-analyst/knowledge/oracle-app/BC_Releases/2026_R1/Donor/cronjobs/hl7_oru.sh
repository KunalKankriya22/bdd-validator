PATH=/usr/local/bin:$PATH/:/home/donsys/bcqas/donorexec:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
UTIL_FILE_DIR=/tmp/bcqas_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec;export ORACLE_PATH
cd $HOME/bcqas/hl7/results
for i in *.*
do
if [ -f $i ]
then
ins_linefeed<$i> $UTIL_FILE_DIR/$i.oru
sqlplus donsys/donsys @HL7HEMO_UPLOAD.sql $i.oru
#/bin/rm $UTIL_FILE_DIR/$i.oru
mv $i save
fi
done

