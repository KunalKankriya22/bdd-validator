PATH=/usr/local/bin:$PATH/:/home/sbcsys/SURROUND/samples:.:$HOME
ORACLE_SID=qlab;export ORACLE_SID
UTIL_FILE_DIR=/tmp/qlab_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/SURROUND/samples;export ORACLE_PATH

sqlplus / @/home/sbcsys/SURROUND/connect_db.sql <<!
@/home/sbcsys/SURROUND/RTURLOAD.sql $1 $$
exit
!

