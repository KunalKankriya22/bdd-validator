PATH=/usr/local/bin:$PATH/:/home/donsys/bcqas/donorexec:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
UTIL_FILE_DIR=/tmp/bcqas_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec;export ORACLE_PATH
cd $HOME/bcqas/vista/results
for i in *.*
do
if [ -f $i ]
then
cp $i $UTIL_FILE_DIR/$i.don
sqlplus donsys/donsys @connect_vista.sql <<!
@vista_donation.sql $i.don
exit
!
mv $i save
fi
done

