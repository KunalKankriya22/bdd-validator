PATH=/usr/local/bin:$PATH/:/home/donsys/bcqas/LTAPI/MOBILE_PC:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
#UTIL_FILE_DIR=/tmp/bcqas_util
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/LTAPI/MOBILE_PC;export ORACLE_PATH
cd /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES
for i in *.bdr
do
if [ -f $i ]
then
/home/donsys/bcqas/LTAPI/MOBILE_PC/text2pdf.x /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES/$i > /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES/MBDR/$i.pdf
mv  /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES/$i /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_ARCH
fi
done

