#	Shell Name	:	DMS4.sh
#
PATH=$PATH:/usr/local/bin:/home/sbcsys/interfaces/PPC_Commander;export PATH
ORACLE_PATH=/home/sbcsys/interfaces/PPC_Commander;export ORACLE_PATH
ORACLE_SID=qlab;export ORACLE_SID
ORAENV_ASK=NO
UTIL_FILE_DIR=/tmp/qlab_util
if [ ! -f /home/sbcsys/interfaces/PPC_Commander/permit.rw ]
then
touch /home/sbcsys/interfaces/PPC_Commander/permit.rw
dms4.x 5400
for i in PPC*
do
if [ $? -ne 0 ]
then
	echo "Problem with DMS4"
else
	echo "DMS4 successful"
fi
#mv $i $UTIL_FILE_DIR
rm /home/sbcsys/interfaces/PPC_Commander/permit.rw
done
else
echo "permit here"
fi
