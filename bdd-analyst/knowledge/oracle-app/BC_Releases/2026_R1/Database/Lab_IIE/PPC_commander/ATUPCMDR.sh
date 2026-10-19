PATH=/usr/local/bin:$PATH:/home/sbcsys/interfaces/PPC_Commander:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO 
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/PPC_Commander;export ORACLE_PATH
#/home/lifetrak/exec/DMS4.sh
cd $HOME/interfaces/PPC_Commander
for i in PPC*
do
if [ -f $i ]
then
vfilesize=`ls -l $i | cut -c24-26`
if [ $vfilesize -ne 0 ]
then
   ins_linefeed <$i> $UTIL_FILE_DIR/$i.ppc
   sqlplus / @runppc.sql $i.ppc
   /bin/rm $UTIL_FILE_DIR/$i.ppc
   mv $i save 
fi
fi
done
