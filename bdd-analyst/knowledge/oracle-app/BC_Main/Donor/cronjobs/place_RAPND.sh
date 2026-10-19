###      Program Name:       place_RAPND.sh
###      Program Version:    02
###      Creation Date:      01/10/2016

PATH=$PATH:/usr/local/bin:/home/donsys/bcqas/donorexec;export PATH
ORACLE_PATH=$ORACLE_PATH:/home/donsys/bcqas/donorexec;export ORACLE_PATH
ORACLE_SID=bcqas;export ORACLE_SID
ORAENV_ASK=NO;export ORAENV_ASK
. /usr/local/bin/oraenv

cd /home/donsys/bcqas/donorexec

sqlplus -s donsys/donsys @place_RAPND.sql



