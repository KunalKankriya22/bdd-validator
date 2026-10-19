PATH=/usr/local/bin:$PATH/:/home/sbcsys/bcsqa/labexec:.:$HOME
ORACLE_SID=BCSQA;export ORACLE_SID
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcsqa/labexec;export ORACLE_PATH
sqlplus sbcsys/sbcsys @connect_db.sql <<!
@SCHCHAGAS.sql 
exit
!

