declare -i count
count=0
for i in `ps -ef |grep dms.sh | cut -c70-75`
do
echo $i
if [ "$i" = "dms.sh" ]
then
count=$count+1
echo $count
echo "dms already running"
fi
done
if [ $count -eq 0 ]
then
echo "dms started"
nohup /home/sbcsys/interfaces/PPC_Commander/dms.sh >/dev/null >>/dev/null &
exit 1
fi
