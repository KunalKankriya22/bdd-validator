export DATABASE=bcsqa
export LABSCRIPTS=/home/sbcsys/$DATABASE/scripts
export LABEXEC=/home/sbcsys/labexec
export LABLOGDIR=/home/sbcsys/$DATABASE/tmp
export ORACLE_HOME=/apps/product/19.0.0/dbhome_1
export PATH=$PATH:/usr/local/bin:$LABSCRIPTS:$LABEXEC:.:$HOME
export UTIL_FILE_DIR=/tmp/$DATABASE"_util"
export HCLL_DIR=/home/sbcsys/hcll

export FTPSITE='epre.domain'
export USER='domain\\username password'
export FTPDIR='epre_input'

cd $UTIL_FILE_DIR

for i in `find . -type f -name "LTHCLLIN_*.dat" -mmin +5`
do
   if [ -s $i ]
   then
      echo 'HCLL data file '$i
      mv $i $HCLL_DIR/
      FILE_SESSION=`expr substr $i 12 12`
      ERR_LOG='LTHCLLIN_ERR_'$FILE_SESSION'.log'
      SUC_LOG='LTHCLLIN_SUC_'$FILE_SESSION'.log'
      echo 'Error log      '$ERR_LOG
      echo 'Success log    '$SUC_LOG
#      mv $ERR_LOG $HCLL_DIR/errors/
#      mv $SUC_LOG $HCLL_DIR/errors/
   fi
done

cd $HOME/hcll

for i in LTHCLLIN_*.dat
do
   if [ -s $i ]
   then
      echo `date +%C%y%m%d%H%M%S`" $i" >> lt_hcll_interface.log
      mv $i $i.inp
      ins_crreturn.x <$i.inp >$i
      mv $i.inp save/

ftp   -n -i $FTPSITE << !
user $USER
cd $FTPDIR
ascii
put $i
quit
!
   mv $i save/
   fi
done
