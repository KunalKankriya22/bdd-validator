PATH=$PATH:/usr/local/bin:/home/donsys/LTHSPR;export PATH
ORACLE_PATH=$ORACLE_PATH:/home/donsys/LTHSPR;export ORACLE_PATH
ORACLE_SID=pdon;export ORACLE_SID
ORAENV_ASK=NO;export ORAENV_ASK
. /usr/local/bin/oraenv

sqlplus / @/home/donsys/LTHSPR/HP2_LT_LOCATIONS.sql
sqlplus / @/home/donsys/LTHSPR/HP2_LT_SPONSORS.sql
sqlplus / @/home/donsys/LTHSPR/HP2_LT_DRIVE_INFO.sql
#sqlplus / @/home/donsys/LTHSPR/HP2_LT_DRIVE_SCHEDULE.sql
#sqlplus / @/home/donsys/LTHSPR/hs2lt_staff_schedule.sql
sqlplus / @/home/donsys/LTHSPR/LT2_HP_DAILY_DATA.sql

