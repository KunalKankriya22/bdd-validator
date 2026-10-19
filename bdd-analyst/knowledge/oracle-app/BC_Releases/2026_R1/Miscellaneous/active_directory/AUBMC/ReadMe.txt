# AUBMC Active Directory LDAP Integration Setup

**Date:** 01/09/2024 (Updated: 05/12/2025)  
**CR:** MLT-7894  
**Scenario:** Custom (ldapsearch-based authentication)  
**Package Version:** Custom Implementation  
**Java Source:** JLdap.sql (Enhanced with timeout handling)

## Overview

This directory contains the configuration and setup files for AUBMC's Active Directory LDAP integration using a custom ldapsearch-based authentication approach. The implementation uses system-level ldapsearch commands for enhanced timeout handling and improved reliability compared to standard JNDI approaches.

## Configuration Details

### LDAP Server Configuration
- **Host:** win2k.aub.edu.lb (example from code)
- **Port:** 636 (LDAPS)
- **Protocol:** LDAPS (SSL enabled)
- **Authentication Method:** ldapsearch command-line tool
- **Timeout:** 6 seconds (default with enhanced timeout handling)
- **Service Account:** Required for user lookup
- **User Attribute:** Configurable (typically sAMAccountName)

## Files Description

### 1. JavaPermissions.sql
**Purpose:** Grants necessary Java file execution permissions for ldapsearch command.

**Key Features:**
- Grants execute permission on `/usr/bin/ldapsearch` for UTIL user
- Grants execute permission on `/usr/bin/ldapsearch` for DBADMN user
- Enables Java code to execute system ldapsearch commands

### 2. JLdap.sql
**Purpose:** Enhanced Java source code for LDAP authentication using ldapsearch.

**Key Features:**
- **Enhanced Timeout Handling:** Multiple timeout mechanisms (process, network, server-side)
- **ldapsearch Integration:** Uses system ldapsearch command instead of JNDI
- **Two-Phase Authentication:** 
  1. Service account searches for user DN
  2. User credentials verified against found DN
- **Error Handling:** Comprehensive error detection and reporting
- **Resource Cleanup:** Proper cleanup of processes and executors
- **LDAP Filter Escaping:** Automatic escaping of special characters in user identifiers

**Functionality:**
- `performAuthentication()`: Main authentication method
- `findUserDN()`: Locates user's Distinguished Name using service account
- `verifyUserPassword()`: Validates user password by attempting bind
- `escapeForLdapFilter()`: Sanitizes input for LDAP filter safety

## Implementation Steps

The setup was completed in the following sequence:

1. **Java Source Installation**
   ```sql
   -- Install the enhanced Java LDAP authentication package
   @JLdap.sql
   ```

2. **Permission Grants**
   ```sql
   -- Grant necessary Java file execution permissions
   @JavaPermissions.sql
   ```

3. **System Requirements**
   ```bash
   # Ensure ldapsearch is available and executable
   which /usr/bin/ldapsearch
   ```

4. **Testing and Validation**
   ```sql
   -- Test authentication functionality
   SELECT LT_LDAP_INTERFACE.perform_ldap_auth(...) FROM dual;
   ```

## Security Considerations

- File execution permissions are granted only to specific database users (UTIL, DBADMN)
- LDAP filter injection protection through automatic character escaping
- Process timeout enforcement prevents hanging connections
- SSL/TLS encryption enforced through ldapsearch LDAPS protocol
- Service account credentials required for user lookup operations
- Proper resource cleanup prevents memory leaks and zombie processes

## Troubleshooting

### Common Issues:
1. **Permission Denied:** Verify `/usr/bin/ldapsearch` is executable and Java permissions are granted
2. **Timeout Errors:** Check network connectivity and adjust timeout values if needed
3. **SSL Certificate Issues:** Ensure proper SSL certificate validation for LDAPS connections
4. **Authentication Failures:** Verify service account credentials and user DN format

### Test Commands:
```sql
-- Test basic authentication
SELECT LT_LDAP_INTERFACE.perform_ldap_auth(
    'CN=service_account,DC=aub,DC=edu,DC=lb',
    'service_password',
    'username',
    'user_password',
    'sAMAccountName',
    'DC=aub,DC=edu,DC=lb',
    'ldaps://win2k.aub.edu.lb:636'
) FROM dual;

-- Check Java permissions
SELECT * FROM user_java_policy WHERE grantee IN ('UTIL', 'DBADMN');

-- Verify ldapsearch availability
SELECT dbms_java.call_java_function('java.lang.System', 'getProperty', 'java.version') FROM dual;
```

## Dependencies

- Oracle Database with Java support
- System ldapsearch utility installed at `/usr/bin/ldapsearch`
- Network connectivity to LDAP server on port 636
- Proper SSL certificate chain for LDAPS connections
- LT_LDAP_INTERFACE package for integration

## Notes

- This implementation uses ldapsearch instead of JNDI for improved timeout handling
- Enhanced timeout mechanisms include process, network, and server-side timeouts
- The solution was updated in May 2025 to address timeout issues (MLT-7894)
- Resource cleanup is automatically handled to prevent system resource exhaustion
- LDAP filter escaping prevents injection attacks through user input sanitization

## Related Documentation

- See `clients_setup.txt` for comparison with other client configurations
- Refer to ldapsearch man page for command-line options and troubleshooting
- Review Oracle Java security documentation for permission management
- Consult AUBMC Active Directory team for service account management
