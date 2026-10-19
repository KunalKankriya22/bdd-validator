PATH=/usr/local/bin:$PATH/:/home/sbcsys/bcqas/labexec:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
UTIL_FILE_DIR=/tmp/bcqas_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/sbcsys/bcqas/labexec;export ORACLE_PATH
   sqlplus ltapi/ltapi @LT_API_ADD_TEST_INTER.sql OBK 

