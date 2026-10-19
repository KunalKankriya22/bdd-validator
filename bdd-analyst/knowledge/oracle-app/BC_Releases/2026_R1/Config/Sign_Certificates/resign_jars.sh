#!/bin/sh
export MW_HOME=/apps/Middleware
export WLS_HOME=$MW_HOME/wlserver_10.3
export WL_HOME=$WLS_HOME
export ORACLE_HOME=$MW_HOME/Oracle_FRHome1
export ORACLE_INSTANCE=$MW_HOME/LT_Inst
export FR_HOME=$ORACLE_HOME
export FR_INST=$ORACLE_INSTANCE
export DOMAIN_HOME=$MW_HOME/user_projects/domains/ClassicDomain
export JAVA_HOME=$MW_HOME/jdk1.6.0_45

mkdir $FR_HOME/forms/java/temp
cd $FR_HOME/forms/java/temp

function sign_jar {
  export MYJAR=$1
  unzip ../$MYJAR
  rm -f META-INF/*.SF META-INF/*.DSA META-INF/*.MF
  # You may need to remove more, so visually check.
  $JAVA_HOME/bin/jar -cvf $MYJAR *
  mv $MYJAR ..
  rm -Rf *
  $FR_INST/bin/sign_webutil.sh $FR_HOME/forms/java/$MYJAR
} 

# IMP - DO NOT SIGN ORACLE SUPPLIED JARS
#sign_jar frmall.jar
#sign_jar frmgeneric_laf.jar
#sign_jar frmmain.jar
#sign_jar frmoracle_laf.jar
#sign_jar frmresources.jar
#sign_jar frmwebutil.jar
#sign_jar jacob.jar

# Add any custom JARs into the list.
# sign_jar images.jar
sign_jar donor.jar
sign_jar hyperlink.jar
sign_jar jacob.jar
sign_jar laf.jar

cd ..
rmdir $FR_HOME/forms/java/temp