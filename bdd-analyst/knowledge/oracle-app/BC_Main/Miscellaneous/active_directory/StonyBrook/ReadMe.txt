01/13/2026
*******************************************
Issue: Stony is unable to connect to their application all of a sudden because of ldaps issues.  I looked and it seems they updated their ldaps certificate and it was updated recently

#################

Notes: 
# 1. Set Oracle environment
export ORACLE_HOME=/your/oracle/home/path

# 2. Download the certificate
cd /path/to/StonyBrook
echo | openssl s_client -connect ldaps.uhmc.sbuh.stonybrook.edu:636 2>/dev/null | \
  openssl x509 -outform PEM > stonybrook-ldaps.crt

# 3. Navigate to Oracle JVM security directory
cd $ORACLE_HOME/javavm/lib/security

# 4. Backup existing cacerts
cp cacerts cacerts.backup.$(date +%Y%m%d_%H%M%S)

# 5. Import certificate (default password: changeit)
keytool -import \
  -trustcacerts \
  -keystore cacerts \
  -storepass changeit \
  -alias stonybrook_ldaps \
  -file /path/to/StonyBrook/stonybrook-ldaps.crt \
  -noprompt

# 6. Verify the import
keytool -list \
  -keystore cacerts \
  -storepass changeit \
  -alias stonybrook_ldaps

# 7. Verify it shows in the full list
keytool -list \
  -keystore cacerts \
  -storepass changeit | grep -i stonybrook

Tried all the scripts in cert_issues_support folder but could not resolve the issue with a simple fix. So, finally went with latest version of JLDAP.sql that uses ldapsearch utility. 

#################

Fix:
1) Installed: JLDAP.sql and JavaPermissions.sql

**************************************************************************************