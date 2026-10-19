# Production LDAPS Setup for Stony Brook
## Certificate-Based Authentication Configuration

This guide provides step-by-step instructions for configuring secure LDAPS connections to `ldaps.uhmc.sbuh.stonybrook.edu` with proper SSL/TLS certificate validation.

---

## Overview

**Problem:** `ldapsearch` returns "Can't contact LDAP server (-1)" due to certificate validation failure
**Solution:** Extract and configure SSL certificates for proper validation
**Security:** Production-ready with certificate validation enabled (`TLS_REQCERT demand`)

---

## Prerequisites

- OpenSSL installed
- OpenLDAP client tools (`ldapsearch`)
- For Oracle integration: Oracle Database with `DBMS_LDAP` package
- Network access to `ldaps.uhmc.sbuh.stonybrook.edu:636`

---

## Part 1: LDAP Client Tools Setup

### Step 1: Extract SSL Certificates

Run the certificate extraction script:

```bash
chmod +x setup_ldap_certificates.sh
./setup_ldap_certificates.sh
```

This script will:
- Connect to the LDAPS server
- Extract the certificate chain
- Save certificates to `./certificates/` directory
- Create a test configuration

**Output files:**
- `certificates/stonybrook-ldap-ca.pem` - CA certificate
- `certificates/stonybrook-ldap-fullchain.pem` - Full certificate chain

### Step 2: Test the Certificate

Run the test command provided by the script:

```bash
LDAPCONF=./certificates/test_ldap.conf ldapsearch \
  -H ldaps://ldaps.uhmc.sbuh.stonybrook.edu:636 \
  -D "CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu" \
  -W \
  -b "OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu" \
  -s sub \
  "(sAMAccountName=svc_bcldaps)" \
  dn
```

**Expected result:** Successful connection without certificate errors

### Step 3: Deploy ldap.conf

**On Linux:**
```bash
# System-wide (requires root)
sudo cp ldap.conf /etc/ldap/ldap.conf
# or
sudo cp ldap.conf /etc/openldap/ldap.conf

# Update the certificate path in the file:
sudo nano /etc/ldap/ldap.conf
# Change: TLS_CACERT /path/to/certificates/stonybrook-ldap-ca.pem
# To:     TLS_CACERT /etc/ssl/certs/stonybrook-ldap-ca.pem

# Copy certificate to system location
sudo cp certificates/stonybrook-ldap-ca.pem /etc/ssl/certs/
sudo chmod 644 /etc/ssl/certs/stonybrook-ldap-ca.pem
```

**On Windows:**
```powershell
# Copy to OpenLDAP configuration directory
copy ldap.conf C:\OpenLDAP\sysconf\ldap.conf
copy certificates\stonybrook-ldap-ca.pem C:\OpenLDAP\sysconf\

# Edit C:\OpenLDAP\sysconf\ldap.conf
# Update: TLS_CACERT C:\OpenLDAP\sysconf\stonybrook-ldap-ca.pem
```

**Per-User (Linux/Mac):**
```bash
cp ldap.conf ~/.ldaprc
# Update TLS_CACERT path to absolute path
nano ~/.ldaprc
```

### Step 4: Verify Production Configuration

Test without `LDAPCONF` override:

```bash
ldapsearch \
  -H ldaps://ldaps.uhmc.sbuh.stonybrook.edu:636 \
  -D "CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu" \
  -W \
  -b "OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu" \
  -s sub \
  "(sAMAccountName=svc_bcldaps)" \
  dn
```

**Success criteria:**
- No certificate errors
- Connection establishes successfully
- Returns LDAP search results

---

## Part 2: Oracle Database Integration

### Step 1: Set Environment

```bash
export ORACLE_HOME=/path/to/oracle/home
export PATH=$ORACLE_HOME/bin:$PATH
```

### Step 2: Run Oracle Wallet Setup

```bash
chmod +x setup_oracle_wallet.sh
./setup_oracle_wallet.sh
```

This script will:
- Create Oracle Wallet at `$ORACLE_HOME/network/admin/wallet`
- Import the Stony Brook CA certificate
- Configure `sqlnet.ora` for SSL/TLS
- Create a test PL/SQL script

### Step 3: Verify Wallet

```bash
orapki wallet display -wallet $ORACLE_HOME/network/admin/wallet
```

**Expected output:**
```
Requested Certificates:
User Certificates:
Trusted Certificates:
Subject:        CN=...
```

### Step 4: Test from PL/SQL

Edit the generated test script:

```bash
nano test_oracle_ldaps.sql
```

Update the password line:
```sql
l_ldap_passwd   VARCHAR2(256) := 'YOUR_ACTUAL_PASSWORD';
```

Run the test:

```bash
sqlplus / as sysdba @test_oracle_ldaps.sql
```

**Expected output:**
```
=== Testing LDAPS Connection ===
[1/4] Initializing LDAPS session...
   Session ID: 12345678
[2/4] Opening SSL connection...
   SSL connection established
[3/4] Binding to LDAP server...
   Bind successful
[4/4] Searching LDAP...
   Search successful
   Entries found: 1

Entry: CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu
  dn: CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu
  sAMAccountName: svc_bcldaps

=== Test Complete - SUCCESS ===
```

### Step 5: Integrate with Existing Scripts

Update your existing AD scripts to use LDAPS with the wallet.

Example for [ad_decrypt.sql](StonyBrook/ad_decrypt.sql):

```sql
DECLARE
    l_session       DBMS_LDAP.session;
    l_retval        PLS_INTEGER;
    l_encrypted_raw RAW(2048);
    l_key           RAW(128) := UTL_RAW.cast_to_raw('tttt');
    l_decrypted_raw RAW(128);
    l_decrypted_pwd VARCHAR2(100);
BEGIN
    -- Get encrypted password from database
    SELECT ad_svc_pwd
    INTO l_encrypted_raw
    FROM active_directory_config
    WHERE ROWNUM = 1;

    -- Decrypt it
    l_decrypted_raw := DBMS_CRYPTO.decrypt(
        src => l_encrypted_raw,
        typ => DBMS_CRYPTO.des_cbc_pkcs5,
        key => l_key
    );
    l_decrypted_pwd := UTL_RAW.cast_to_varchar2(l_decrypted_raw);

    -- Initialize LDAPS connection
    DBMS_LDAP.USE_EXCEPTION := TRUE;
    l_session := DBMS_LDAP.init('ldaps.uhmc.sbuh.stonybrook.edu', 636);

    -- Open SSL with wallet
    l_retval := DBMS_LDAP.open_ssl(
        ld              => l_session,
        sslwrl          => 'file:' || DBMS_LDAP.GET_WALLET_LOCATION,
        sslwalletpasswd => '',
        sslauth         => 1
    );

    -- Bind with decrypted password
    l_retval := DBMS_LDAP.simple_bind_s(
        l_session,
        'CN=svc_bcldaps,OU=Users-ServiceAccounts,DC=uhmc,DC=sbuh,DC=stonybrook,DC=edu',
        l_decrypted_pwd
    );

    -- Use the connection...

    -- Cleanup
    l_retval := DBMS_LDAP.unbind_s(l_session);
END;
/
```

---

## Troubleshooting

### Issue: Certificate expired

**Solution:**
```bash
# Re-extract certificates
./setup_ldap_certificates.sh

# Re-import to Oracle Wallet
./setup_oracle_wallet.sh
```

### Issue: "ORA-29024: Certificate validation failure"

**Check:**
1. Wallet location in `sqlnet.ora` is correct
2. Wallet files exist and are readable
3. Certificate is not expired

```bash
# Verify wallet
orapki wallet display -wallet $ORACLE_HOME/network/admin/wallet

# Check certificate expiry
openssl x509 -in certificates/stonybrook-ldap-ca.pem -noout -dates
```

### Issue: "SSL connection failed"

**Debug:**
```sql
-- Enable LDAP tracing
ALTER SYSTEM SET events '28033 trace name context forever, level 12';

-- Check trace files in:
-- $ORACLE_BASE/diag/rdbms/<db_name>/<instance_name>/trace/
```

### Issue: Still getting certificate errors

**Verify:**
1. `TLS_REQCERT` is set to `demand` (not `never`)
2. Certificate path is absolute (not relative)
3. Certificate file is readable by the user/process

```bash
# Test certificate manually
openssl verify -CAfile certificates/stonybrook-ldap-ca.pem certificates/stonybrook-ldap-ca.pem

# Check permissions
ls -l /etc/ssl/certs/stonybrook-ldap-ca.pem
```

---

## Security Notes

### Production Checklist

- [ ] `TLS_REQCERT demand` is set (never use `never` in production)
- [ ] Certificate files have appropriate permissions (644 or 600)
- [ ] Wallet directory has restricted permissions (700)
- [ ] Passwords are encrypted in database (not hardcoded)
- [ ] Connection uses LDAPS (port 636), not LDAP (port 389)
- [ ] Certificate expiration is monitored
- [ ] Backup of wallet exists

### Certificate Rotation

Set up monitoring for certificate expiration:

```bash
# Check expiration date
openssl x509 -in certificates/stonybrook-ldap-ca.pem -noout -enddate

# Create a cron job to check monthly
0 0 1 * * /path/to/check_cert_expiry.sh
```

### Encrypted Password Storage

The current encryption uses DES-CBC which is considered weak. Consider upgrading to AES:

```sql
-- Upgrade to AES-256
l_encrypted_raw := DBMS_CRYPTO.encrypt(
    src => l_pwd_raw,
    typ => DBMS_CRYPTO.ENCRYPT_AES256 + DBMS_CRYPTO.CHAIN_CBC + DBMS_CRYPTO.PAD_PKCS5,
    key => l_key  -- Use a 256-bit key
);
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `setup_ldap_certificates.sh` | Extract SSL certificates from LDAPS server |
| `setup_oracle_wallet.sh` | Configure Oracle Wallet for DBMS_LDAP |
| `ldap.conf` | LDAP client configuration template |
| `test_oracle_ldaps.sql` | PL/SQL test script (generated) |
| `ad_decrypt.sql` | Decrypt AD passwords from database |
| `ad_settings.sql` | Encrypt AD passwords to database |

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Oracle/LDAP logs
3. Verify network connectivity to LDAPS server
4. Ensure certificates are current and valid

---

**Last Updated:** 2026-01-13
**Environment:** Stony Brook LDAPS (ldaps.uhmc.sbuh.stonybrook.edu:636)
**Security Level:** Production (certificate validation enabled)
