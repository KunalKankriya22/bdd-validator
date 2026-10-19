PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/Galileo:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/Galileo;export ORACLE_PATH
cd $HOME/interfaces/Galileo
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.gal
   sqlplus / @ATUPGALI.sql $i.gal
   /bin/rm $UTIL_FILE_DIR/$i.gal
   mv $i save
fi
done

