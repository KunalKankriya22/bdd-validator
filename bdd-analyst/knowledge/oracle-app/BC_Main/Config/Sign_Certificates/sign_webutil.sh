#!/bin/sh
#
# sign_webutil.sh
#
# Copyright (c) 2002, 2012, Oracle and/or its affiliates. All rights reserved. 
#
#   NAME
#      sign_webutil.sh - Sample script to sign frmwebutil.jar and jacob.jar
#   USAGE
#      sign_webutil.sh <jar_file>
#      jar_file : Path of the jar file to be signed. Prefer to use forward
#                 slash instead of back-slash. Otherwise, some characters may
#                 be strangely escaped. e.g. \f may be printed as 'female'
#                 symbol character on some systems.
#   NOTES
#      This script uses keytool and jarsigner utilities, which comes
#      along with JDK in its bin directory. If these utilities do not exist,
#      signing will fail even though the script may show a successful signing.
#
# The following are the Distinguished Names for keytool. You can change them
# to generate your own key.
# CN = Common Name
# OU = Organization Unit
# O  = Organization
# C  = Country code
#
# Certificate settings:
# These are used to generate the initial signing certificate
# Change them to suite your organisation
#
DN_CN="MIS LifeTrak Certificate (2024)"
DN_OU="Oracle Forms"
DN_O="Mediware Information Systems"
DN_C=US
#
# Give your keystore file
KEYSTORE=$HOME/keystore/LT_identity.jks
#
# If KEYSTORE already exists, old KEYSTORE_PASSWORD for the keystore file must
# be correctly given here. If KEYSTORE does not already exist, any password
# given here will be taken for the new KEYSTORE file to be created.
#
# *** Remove the text after the '=' below and replace with your password. ***
KEYSTORE_PASSWORD=mispasswd
#
# Give your alias key here.
#
#JAR_KEY=webutil2
JAR_KEY=LTselfsigned
#
# Key Password for the given key to be used for signing.
#
# *** Remove the text after the '=' below and replace with your password. ***
JAR_KEY_PASSWORD=mispasswd

#
# Number of days before this certificate expires
#
VALIDDAYS=3600


#
# Signing script starts here...
#
if test $# -lt 1
then
  echo Jar file name not given for signing. Use
  echo "$0 <jar-file>"
  exit 1
elif test $# -ne 1
then
  echo Incorrect parameters. Use
  echo "$0 <jar-file>"
  exit 1
fi

echo "Generating a self signing certificate for key=$JAR_KEY..."
error_text=`/apps/Middleware/Oracle_FRHome1/jdk/bin/keytool -genkey -dname "CN=$DN_CN, OU=$DN_OU, O=$DN_O, C=$DN_C" \
        -alias $JAR_KEY -keypass $JAR_KEY_PASSWORD -keystore $KEYSTORE \
        -storepass $KEYSTORE_PASSWORD -validity $VALIDDAYS`
# Check for any error
found=`echo "$error_text" | grep -c "already exists"`
isError=`echo "$error_text" | grep -c "error"`

if test $found -ne 0
then
# Let us show this as warning.
  echo "Warning: $JAR_KEY already present in $KEYSTORE"
elif test $isError -ne 0
then
  echo $error_text
else
  echo "...successfully done."
fi

echo "\n"
# Signing the jar
echo "Backing up $1 as $1.old..."
cp -f $1 $1.old
echo "\n"
echo "Signing $1 using key=$JAR_KEY..."
error_text=`/apps/Middleware/Oracle_FRHome1/jdk/bin/jarsigner -keystore $KEYSTORE -storepass $KEYSTORE_PASSWORD -keypass $JAR_KEY_PASSWORD \
          $1 $JAR_KEY`
# Check for any error
if test "$error_text" != ""
then
  echo $error_text
  echo "Signing $1 failed."
else
  echo "...successfully done."
fi

