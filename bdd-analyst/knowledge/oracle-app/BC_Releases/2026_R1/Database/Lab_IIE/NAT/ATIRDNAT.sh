PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/NAT:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/NAT;export ORACLE_PATH
cd $HOME/interfaces/NAT
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.nat
   sqlplus / @ATIRDNAT.sql $i.nat
   /bin/rm $UTIL_FILE_DIR/$i.nat
   mv $i save
fi
done

