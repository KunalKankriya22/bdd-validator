# API Upload Script.
# Uploads data from extract files to API Tables.
# Steps
# 1. Looks for .zip files and unzips using OS unzip command.
# 2. Looks for extract files and passes them to sql script to insert the file names into mobile_upload_files table.
# 3. Loads data from files to api tables.
# 4. Archives log files.
# 5. Calls GENBDR convert script to convert .bdr to .pdf
#
#-----------------------------------------------------------------------------------------
#
# Ver:01 - Orignial file
# Ver:02 - 12/08/2022 - Zip file processing added
# Ver:03 - 01/30/2023 - zip archive added.
# 

PATH=/usr/local/bin:$PATH/:/home/donsys/bcqas/LTAPI/MOBILE_PC/:.:$HOME
ORACLE_SID=bcqas;export ORACLE_SID
UTIL_FILE_DIR=/home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES
ORAENV_ASK=NO
. oraenv
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/LTAPI/MOBILE_PC;export ORACLE_PATH
cd /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES
chmod 664 *
chmod 765 MBDR

## Unzip zip files and archive.
for i in *.zip
do
if [ -f $i ]
then
unzip -o $i
mv $i /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_ARCH
fi
done

## bdr's are not uploaded as their conversion to pdf is handled by another script.
## bde's are uploaded and decrypted to bdr's.
for i in *.txt *.dat *.hdr *.enc *.tif *.bde
do
if [ -f $i ]
then
#cp $i $UTIL_FILE_DIR/$i
sqlplus donsys/donsys @/home/donsys/bcqas/LTAPI/MOBILE_PC/connect_ltapi.sql <<!
@/home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_INS_MOBILE_UPLOAD_FILES.sql $i
exit
!
fi
done

## API upload process.
sqlplus donsys/donsys @/home/donsys/bcqas/LTAPI/MOBILE_PC/connect_ltapi.sql <<!
@/home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES_UPLOAD.sql
exit
!

mv /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_FILES/*.log /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_LOGS

sh /home/donsys/bcqas/LTAPI/MOBILE_PC/MPC_GENBDR_Convert.sh
