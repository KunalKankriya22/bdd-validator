PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/BacT:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/BacT;export ORACLE_PATH
cd $HOME/interfaces/BacT
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.bact
   sqlplus / @runbact.sql $i.bact
   /bin/rm $UTIL_FILE_DIR/$i.bact
   mv $i save
fi
done
