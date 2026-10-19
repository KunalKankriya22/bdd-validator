#!/bin/sh
echo $1
jar_file=$1
export CLASSPATH=/apps/Middleware/Oracle_FRHome1/jdk/bin
export PATH=/apps/Middleware/LT_Inst/bin:$PATH
sign_webutil.sh $jar_file
