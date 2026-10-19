PATH=/usr/local/bin:$PATH/:/home/donsys/bcqas/LTAPI/MOBILE_PC:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
UTIL_FILE_DIR=/home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/LTAPI/MOBILE_PC;export ORACLE_PATH
sqlplus /nolog @connect_ltapi.sql <<!
@MPC_MASTER_UPLOAD.sql 
exit
!
