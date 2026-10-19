PATH=$PATH:/usr/local/bin:/home/sbcsys/SURROUND; export PATH
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/SURROUND; export ORACLE_PATH
ORACLE_SID=qlab; export ORACLE_SID
ORAENV_ASK=NO; export ORAENV_ASK
UTIL_FILE_DIR=/tmp/qlab_util


. /usr/local/bin/oraenv

sqlplus / @/home/sbcsys/SURROUND/connect_db.sql <<!
@/home/sbcsys/SURROUND/ATUPSURND.sql $i $$
exit
!
mv /tmp/qlab_util/*.LAB /home/sbcsys/SURROUND/samples

cd /home/sbcsys/SURROUND/samples
for i in *.LAB
do
if [ -f $i ]
then
cp $i $UTIL_FILE_DIR/$i
sh /home/sbcsys/SURROUND/RTURLOAD.sh $i 
rm $UTIL_FILE_DIR/$i
mv $i save
fi
done


