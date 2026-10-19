PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/PK7200:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/PK7200;export ORACLE_PATH
cd $HOME/interfaces/PK7200
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.PK72
   sqlplus / @ATUPK7200.sql $i.PK72
#   /bin/rm $UTIL_FILE_DIR/$i.PK72
   mv $i save
fi
done

