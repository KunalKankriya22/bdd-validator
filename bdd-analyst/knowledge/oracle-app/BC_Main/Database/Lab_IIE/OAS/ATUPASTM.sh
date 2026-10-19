PATH=/usr/local/bin:$PATH/:/home/sbcsys/interfaces/OAS:.:$HOME
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/interfaces/OAS;export ORACLE_PATH
ORACLE_SID=qlab;export ORACLE_SID
ORAENV_ASK=NO
. oraenv
cd $HOME/interfaces/OAS
for i in *.txt
do
if [ -f $i ]
then
   ins_linefeed < $i > /tmp/qlab_util/$i.a
   sqlplus / @runastm.sql /tmp/qlab_util/$i.a
   #/bin/rm /LifeTrak/misc/tempelt/$i.a
   mv $i save
fi
done
