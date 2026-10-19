# Environment Configuration Summary

## Overview
This document summarizes the configuration changes made to support environment-based configuration using APP_ENV and the `extractIdentifiers` function fallback to $_ENV variables.

**Note: BC_ENVIRONMENT has been replaced by APP_ENV. This document is maintained for historical reference.**

## Changes Made

### 1. Enhanced extractIdentifiers Function
**File:** `shared/BCAgentCore.php`
- ✅ Added $_ENV fallback logic when identifiers not found in headers
- ✅ Enhanced logging to show source of identifiers (headers vs environment)
- ✅ Maintains backward compatibility with existing ForgeRock header processing

### 2. Apache SSL Configuration
**File:** `ssl.conf`
- ✅ Added `SetEnv BC_ENVIRONMENT prod` to virtual host
- ✅ Removed duplicate security headers (handled at server level)
- ✅ Maintains all existing ForgeRock header processing

### 3. PHP-FPM Configuration
**File:** `www.conf`
- ✅ Set `clear_env = no` to allow ALL Apache environment variables to pass through
- ✅ **No explicit `env[]` declarations needed** - Apache's `SetEnv` variables automatically become available
- ✅ Simplified configuration - `clear_env = no` handles everything

### 4. Application Configuration
**File:** `.htaccess`
- ✅ Removed duplicate security headers (handled in ssl.conf)
- ✅ Maintains URL routing and file protection
- ✅ No conflicts with server-level configuration

### 5. Cleanup
- ✅ Disabled unused `php-fpm-forgerock.conf` (renamed to `.disabled`)
- ✅ Confirmed using `www` pool via `/run/php-fpm/www.sock`

## How It Works

### Current Flow for ForgeRock Headers:
```
ForgeRock Agent → HTTP Headers → Apache → PHP-FPM → extractIdentifiers()
                                                    ↓
                                              Finds in $headers ✅
```

### New Flow for BC_ENVIRONMENT:
```
Apache ssl.conf → SetEnv BC_ENVIRONMENT → PHP-FPM → extractIdentifiers()
                                                   ↓
                                            No headers found
                                                   ↓
                                            Checks $_ENV ✅
```

## Configuration Hierarchy

1. **Apache Server Level** (`ssl.conf`)
   - SSL configuration
   - ForgeRock agent integration
   - BC_ENVIRONMENT variable
   - Security headers

2. **PHP-FPM Pool Level** (`www.conf`)
   - Environment variable passing
   - Process management
   - Pool-specific settings

3. **Application Level** (`.htaccess`)
   - URL routing
   - File protection
   - Application-specific rules

## Testing the Configuration

### 1. Verify BC_ENVIRONMENT is Available
Create a test PHP file:
```php
<?php
echo "BC_ENVIRONMENT: " . ($_ENV['BC_ENVIRONMENT'] ?? 'not set') . "\n";
echo "Source: " . (isset($_ENV['BC_ENVIRONMENT']) ? 'environment' : 'not found') . "\n";
?>
```

### 2. Test extractIdentifiers Function
The enhanced function will:
1. First check HTTP headers for ForgeRock identifiers (existing functionality)
2. If no identifiers found, check $_ENV for BC_ENVIRONMENT
3. Log the source of identifiers for debugging

## Deployment Steps

### 1. Restart Services
```bash
# Restart PHP-FPM to load new configuration
sudo systemctl restart php-fpm

# Restart Apache to load SSL configuration changes
sudo systemctl restart httpd
```

### 2. Verify Services
```bash
# Check PHP-FPM status
sudo systemctl status php-fpm

# Check Apache status
sudo systemctl status httpd

# Verify only www pool is running
ps aux | grep php-fpm
```

### 3. Test Application
- Access your BC Agent applications
- Check logs for identifier extraction messages
- Verify BC_ENVIRONMENT is available when needed

## Environment-Specific Configuration

To change environments, update the `SetEnv` directive in `ssl.conf`:

```apache
# For Production
SetEnv BC_ENVIRONMENT prod

# For QA
SetEnv BC_ENVIRONMENT qa

# For Development
SetEnv BC_ENVIRONMENT dev
```

## Troubleshooting

### If BC_ENVIRONMENT is not available:
1. Check `clear_env = no` in `www.conf`
2. Confirm `SetEnv BC_ENVIRONMENT prod` in `ssl.conf`
3. Restart PHP-FPM: `sudo systemctl restart php-fpm`
4. Test with: `<?php var_dump($_ENV['BC_ENVIRONMENT']); ?>`

### If ForgeRock headers stop working:
1. Check Apache error logs: `tail -f /var/log/httpd/ssl_error_log`
2. Verify ForgeRock agent is running
3. Check ForgeRock header logs: `tail -f /var/log/httpd/forgerock_headers.log`

## Security Notes

- Environment variables are only accessible to the specific PHP-FPM pool
- BC_ENVIRONMENT cannot be overridden by application-level configuration
- All existing ForgeRock security measures remain in place
- Security headers are consistently applied at the server level

## Files Modified

1. `shared/BCAgentCore.php` - Enhanced extractIdentifiers function
2. `ssl.conf` - Added BC_ENVIRONMENT variable
3. `www.conf` - Configured environment variable passing
4. `.htaccess` - Removed duplicate headers
5. `php-fpm-forgerock.conf` - Disabled (renamed to .disabled)

## Configuration Complete ✅

The BC_ENVIRONMENT fallback functionality is now fully configured and ready for use.
