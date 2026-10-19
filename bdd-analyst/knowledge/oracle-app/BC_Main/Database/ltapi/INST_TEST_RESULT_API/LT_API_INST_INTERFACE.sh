PATH=/usr/local/bin:$PATH/:/home/sbcsys/bcsqa/labexec:.:$HOME
ORACLE_SID=BCSQA;export ORACLE_SID
UTIL_FILE_DIR=/tmp/bcsqa_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcsqa/labexec;export ORACLE_PATH
   sqlplus ltapi/ltapi @LT_API_INST_INTERFACE.sql S201 DAL
