export DONOREXEC=/home/donsys/bcqas/donorexec
export PATH=$PATH:/usr/local/bin:$DONORCRON:$DONOREXEC
export ORACLE_SID=bcqas
export ORAENV_ASK=NO
. /usr/local/bin/oraenv
export ORACLE_PATH=$ORACLE_HOME:$DONORCRON:$DONOREXEC
cd $DONOREXEC
sqlplus -s donsys/donsys @release_list.sql
sqlplus -s donsys/donsys @rptclean.sql
sqlplus -s donsys/donsys @ftclean.sql
sqlplus -s donsys/donsys @emfclean.sql
sqlplus -s util/util @USER_REFRESH_TOKEN-clean.sql

if [ $? -eq 0 ] 
   then 
        COMPL="completed" 
   else 
        COMPL="aborted" 
   fi ;

