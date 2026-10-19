# Sanford Health Active Directory LDAP Integration Setup

**Date:** Not specified  
**CR:** Not specified  
**Scenario:** 2 (Non-SSL with Service Account)  
**Package Version:** LT_LDAP_INTERFACE.pkg  
**Java Source:** Standard JNDI implementation

## Overview

This directory contains the configuration and setup files for Sanford Health's Active Directory LDAP integration using non-SSL authentication with service account. The implementation follows Scenario 2 configuration pattern which requires service account authentication but does not use SSL encryption.

## Configuration Details

### LDAP Server Configuration
- **Host:** sflmdc6.sanfordhealth.org (Primary), sflmdc1.sanfordhealth.org (Alternative)
- **Port:** 389 (Non-SSL)
- **Protocol:** LDAP (Non-SSL)
- **Service Account:** srvBloodCntr_AD (Current), srvHCLL_ADMINDEV (Legacy)
- **Service Account DN:** CN=SERVICE ACCOUNT\,srvBloodCntr_AD,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org
- **Search Base:** DC=SanfordHealth,DC=org
- **User Attribute:** cn
- **Search Filter:** &(objectCategory=user)(sAMAccountName=<ADUSERID>)

## Files Description

### 1. ACTIVE_DIRECTORY_CONFIG_SETUP.sql
**Purpose:** Dynamic configuration script that sets up ACTIVE_DIRECTORY_CONFIG table with current parameters.

**Key Features:**
- Configures primary LDAP server (sflmdc6.sanfordhealth.org)
- Sets up service account with encrypted password storage
- Uses DES CBC PKCS5 encryption for password security
- Implements proper cleanup of existing configurations
- Contains current service account credentials and configuration

### 2. active_directory_config.sql
**Purpose:** Static configuration script with versioned INSERT statements for ACTIVE_DIRECTORY_CONFIG table.

**Key Features:**
- **Version 1 (V01):** Legacy configuration using srvHCLL_ADMINDEV service account
- **Version 2 (V02):** Current configuration using srvBloodCntr_AD service account
- Contains pre-encrypted passwords for both service accounts
- Provides fallback configuration options

### 3. ldapsearch_commands.txt
**Purpose:** Collection of tested ldapsearch commands for manual LDAP testing and troubleshooting.

**Test Commands Include:**
- Service account authentication verification
- User lookup examples (BOEREMAM user)
- Both legacy and current service account testing
- Sample output showing successful LDAP queries
- DN format validation examples

### 4. Test_Script.sql
**Purpose:** PL/SQL test script to validate LDAP authentication functionality.

**Test Parameters:**
- Uses srvBloodCntr_AD service account for testing
- Includes debug mode for detailed output
- Tests authentication through lt_ldap_interface package
- Provides status output for verification

## Implementation Steps

The setup can be completed using either approach:

### Option 1: Dynamic Configuration
```sql
-- Run the dynamic configuration script
@ACTIVE_DIRECTORY_CONFIG_SETUP.sql
```

### Option 2: Static Configuration
```sql
-- Use the versioned configuration script
@active_directory_config.sql
```

### Testing and Validation
```sql
-- Test the LDAP authentication functionality
@Test_Script.sql
```

### Manual Testing (Optional)
```bash
# Use ldapsearch commands from ldapsearch_commands.txt
ldapsearch -x -D "CN=SERVICE ACCOUNT\,srvBloodCntr_AD,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org" \
           -w 'password' -H ldap://sflmdc6.sanfordhealth.org:389 \
           -b "DC=SanfordHealth,DC=org" "(sAMAccountName=username)" cn mail
```

## Security Considerations

- Service account passwords are encrypted using DES CBC PKCS5 algorithm
- Non-SSL configuration requires secure network environment
- Service account has limited permissions for user lookup only
- Multiple service accounts available for redundancy
- Password rotation should follow Sanford Health security policies

## Troubleshooting

### Common Issues:
1. **Connection Timeouts:** Verify network connectivity to sflmdc6.sanfordhealth.org:389
2. **Authentication Failures:** Check service account credentials and DN format
3. **User Not Found:** Verify user exists in DC=SanfordHealth,DC=org domain
4. **Permission Errors:** Ensure service account has proper LDAP read permissions

### Test Commands:
```sql
-- Test basic authentication
@Test_Script.sql

-- Verify configuration
SELECT * FROM active_directory_config;

-- Check service account setup
SELECT ad_svc_userdn, ad_search_base, ad_userid_attrib FROM active_directory_config;
```

### Manual Verification:
```bash
# Test service account connectivity
ldapsearch -x -D "CN=SERVICE ACCOUNT\,srvBloodCntr_AD,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org" \
           -w 'password' -H ldap://sflmdc6.sanfordhealth.org:389 \
           -b "DC=SanfordHealth,DC=org" "(sAMAccountName=testuser)" cn

# Verify DN format
ldapsearch -x -D "CN=SERVICE ACCOUNT\,srvBloodCntr_AD,OU=Service Accounts,OU=Sioux Falls,DC=SanfordHealth,DC=org" \
           -w 'password' -H ldap://sflmdc6.sanfordhealth.org:389 \
           -b "DC=SanfordHealth,DC=org" "(sAMAccountName=srvBloodCntr_AD)" dn
```

## Dependencies

- Oracle Database with ACTIVE_DIRECTORY_CONFIG table
- Network connectivity to sflmdc6.sanfordhealth.org:389
- LT_LDAP_INTERFACE package for authentication
- Service account credentials with proper LDAP permissions
- Secure network environment (since SSL is not used)

## Notes

- Configuration supports both current (srvBloodCntr_AD) and legacy (srvHCLL_ADMINDEV) service accounts
- Non-SSL configuration requires secure internal network
- Service account DN contains escaped comma character (\,) due to naming convention
- Multiple LDAP servers available for redundancy (sflmdc1, sflmdc6)
- User attribute is set to 'cn' rather than typical 'sAMAccountName'
- Search filter uses sAMAccountName for user identification

## Related Documentation

- See `clients_setup.txt` for comparison with other client configurations
- Refer to LT_LDAP_INTERFACE package documentation for API details
- Review Sanford Health Active Directory team documentation for service account management
- Consult ldapsearch_commands.txt for manual testing procedures
