PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/Tango:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/Tango;export ORACLE_PATH
cd $HOME/interfaces/Tango
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.tgo
   sqlplus / @ATUPTANG.sql $i.tgo
   /bin/rm $UTIL_FILE_DIR/$i.tgo
   mv $i save
fi
mv $UTIL_FILE_DIR/ATUPTANG*.r $HOME
done
