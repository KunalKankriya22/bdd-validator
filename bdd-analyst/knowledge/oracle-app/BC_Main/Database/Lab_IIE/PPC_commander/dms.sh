#logfile="/home/sbcsys/dms/dms.log"
dir="/home/sbcsys/interfaces/PPC_Commander"
scriptdir="/home/sbcsys/interfaces/PPC_Commander"
declare -i count
count=1
while true
do
   export FDATE=`date +%Y%m%d%H%M%S`
   for test in `ls PPC_*`
   do
      if [ -f $scriptdir/$test ]
      then
         chmod 777 $scriptdir/$test
         sleep 75
         size1=`ls -al $scriptdir/$test | awk '{ print $5 }'`
         size2="$size1"
         while [ $count -le 5 ]
         do
            if [ $size1 -eq $size2 ]
            then
               size1=`ls -al $scriptdir/$test | awk '{ print $5 }'`
               count=$count+1
               echo $count
            else
               count=1
               size1=`ls -al $scriptdir/$test | awk '{ print $5 }'`
               size2="$size1"
            fi 
            sleep 90
         done 
         size3=`ls -al $scriptdir/$test | awk '{ print $5 }'`
         if [ $size3 -eq 0 ]
         then
            echo "The file $test is size zero"
         else
            echo "The file $test is size $size3 and will be moved"
            mv $scriptdir/$test $dir/$test
            rm $scriptdir/$test 
            chmod 777 $dir/$test
            sleep 5
#            echo $FDATE >> $logfile
#           echo "Moving $test to $scriptdir/$test" >> $logfile
         fi
      fi
   done
   count=1
   sleep 10
done
