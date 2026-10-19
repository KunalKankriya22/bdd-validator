PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/provue:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/provue;export ORACLE_PATH
cd $HOME/interfaces/provue
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.pro
   sqlplus / @ATUPROVUE.sql $i.pro
   /bin/rm $UTIL_FILE_DIR/$i.pro
   mv $i save
fi
done

