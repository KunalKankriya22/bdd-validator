PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/Aeroset:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO 
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/Aeroset;export ORACLE_PATH
cd $HOME/interfaces/Aeroset
for i in *.txt
do
if [ -f $i ]
then
   cp $i $UTIL_FILE_DIR/$i.file
   sqlplus / @runaerofile.sql $i.file
   /bin/rm $UTIL_FILE_DIR/$i.file
   mv $i save 
fi
done
cp $UTIL_FILE_DIR/*AERO*.aer $HOME/interfaces/Aeroset
#/bin/rm $UTIL_FILE_DIR/*AERO*.aer
cd $HOME/interfaces/Aeroset
for i in *AERO*.aer
do
if [ -f $i ]
then
  cp $i $UTIL_FILE_DIR
  sqlplus / @runaero.sql $i
  /bin/rm $UTIL_FILE_DIR/$i
  mv $i save
fi
done
