PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/Prism:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/Prism;export ORACLE_PATH
cd $HOME/interfaces/Prism
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.psm
   sqlplus / @ATUPRISM.sql $i.psm
   /bin/rm $UTIL_FILE_DIR/$i.psm
   mv $i save
fi
done

