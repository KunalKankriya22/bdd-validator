# CVPH Active Directory LDAP Integration Setup

**Date:** 11/04/2025  
**CR:** MLT-8576  
**Scenario:** 3 (SSL with Service Account)  
**Package Version:** LT_LDAP_INTERFACE.pkg (06)  
**Java Source:** JLDAP.sql (01)

## Overview

This directory contains the configuration and setup files for CVPH's Active Directory LDAP integration using SSL authentication with a service account. The implementation follows Scenario 3 configuration pattern which requires SSL connectivity and service account authentication.

## Configuration Details

### LDAP Server Configuration
- **Host:** ldaps.aaddsuvmhealth.org
- **Port:** 636 (SSL)
- **Protocol:** LDAPS (SSL enabled)
- **Service Account:** svc_wellskybb001
- **Service Account DN:** CN=svc_wellskybb001,OU=AADDC Users,DC=aaddsuvmhealth,DC=org
- **Search Base:** OU=AADDC Users,DC=aaddsuvmhealth,DC=org
- **User Attribute:** CN
- **IP Address:** 52.151.244.90:636 (backup/alternative)

## Files Description

### 1. ad_config.sql
**Purpose:** Configures the ACTIVE_DIRECTORY_CONFIG table with CVPH-specific LDAP settings.

**Key Features:**
- Sets up SSL connection parameters
- Configures service account credentials with encryption
- Defines search base and user attributes
- Uses DES CBC PKCS5 encryption for password storage
- Implements proper cleanup of existing configurations

### 2. java_permissions.sql
**Purpose:** Grants necessary Java socket permissions for LDAP connectivity.

**Permissions Granted:**
- Socket connection permissions for UTIL and DBADMN users
- Access to both hostname (ldaps.aaddsuvmhealth.org:636) and IP (52.151.244.90:636)
- Connect and resolve permissions for secure LDAP communication

### 3. ad_test.sql
**Purpose:** Test script to validate LDAP authentication functionality.

**Test Parameters:**
- Uses service account: svc_wellskybb001
- Tests authentication against configured LDAP server
- Validates connection and user lookup functionality
- Outputs authentication status for verification

### 4. JLDAP.sql (Referenced)
**Purpose:** Java source code for LDAP authentication operations.

**Functionality:**
- Implements SSL LDAP authentication
- Supports service account-based user lookup
- Handles both service and user authentication
- Provides proper connection cleanup and error handling

## Implementation Steps

The setup was completed in the following sequence:

1. **Configuration Setup**
   ```sql
   -- Run the Active Directory configuration script
   @ad_config.sql
   ```

2. **Java Source Installation**
   ```sql
   -- Install the Java LDAP authentication package
   @JLDAP.sql
   ```

3. **Permission Grants**
   ```sql
   -- Grant necessary Java socket permissions
   @java_permissions.sql
   ```

4. **Testing and Validation**
   ```sql
   -- Test the LDAP authentication functionality
   @ad_test.sql
   ```

## Security Considerations

- Service account password is encrypted using DES CBC PKCS5 algorithm
- SSL/TLS encryption is enforced for all LDAP communications
- Socket permissions are granted only to specific database users (UTIL, DBADMN)
- Connection cleanup is properly implemented to prevent resource leaks

## Troubleshooting

### Common Issues:
1. **Connection Timeouts:** Verify firewall rules allow outbound connections on port 636
2. **SSL Certificate Issues:** Ensure proper SSL certificate validation
3. **Permission Errors:** Verify Java permissions are correctly granted
4. **Authentication Failures:** Check service account credentials and DN format

### Test Commands:
```sql
-- Test basic connectivity
@ad_test.sql

-- Verify configuration
SELECT * FROM active_directory_config;

-- Check Java permissions
SELECT * FROM user_java_policy WHERE grantee IN ('UTIL', 'DBADMN');
```

## Dependencies

- Oracle Database with Java support
- Network connectivity to ldaps.aaddsuvmhealth.org:636
- LT_LDAP_INTERFACE package (version 06)
- Proper SSL certificate chain for LDAP server

## Notes

- This configuration follows the standard Scenario 3 pattern used across multiple clients
- Service account credentials should be updated as per security policies
- Regular testing is recommended to ensure continued functionality
- Backup IP address (52.151.244.90) is configured for redundancy

## Related Documentation

- See `clients_setup.txt` for comparison with other client configurations
- Refer to LT_LDAP_INTERFACE package documentation for API details
- Review Active Directory team documentation for service account management
