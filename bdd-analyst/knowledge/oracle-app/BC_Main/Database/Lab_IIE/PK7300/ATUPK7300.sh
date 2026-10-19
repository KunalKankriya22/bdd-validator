PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/PK7300:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/PK7300;export ORACLE_PATH
cd $HOME/interfaces/PK7300
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.pk7
   sqlplus / @ATUPK7300.sql $i.pk7
#   /bin/rm $UTIL_FILE_DIR/$i.pk7
   mv $i save
fi
done

