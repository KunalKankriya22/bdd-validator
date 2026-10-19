PATH=/usr/local/bin:$PATH/:/home/sbcsys/SURROUND_FILES:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/SURROUND_FILES;export ORACLE_PATH
cd $HOME/SURROUND_FILES
for i in *.txt
do
if [ -f $i ]
then
cp $i $UTIL_FILE_DIR/$i.sur
sqlplus / @ATUPSURD_FILES.sql $i.sur
/bin/rm $UTIL_FILE_DIR/$i.sur
#mv $i save
fi
#mv $UTIL_FILE_DIR/ATUPSURD*.r $HOME
mv $UTIL_FILE_DIR/*.LAB $HOME/SURROUND_FILES/results
done
