# BC_Agents - Blood Center Agent Application

## Overview

BC_Agents is a production-ready PHP application that handles authentication redirects for blood center agents. It extracts user identification from request headers, stores session data in an Oracle database, and redirects users to the appropriate application URL.

This restructured version (v2.0.0) provides improved security, maintainability, and deployment flexibility with dual applications sharing common logic and environment-based configuration.

## Features

- **Dual Applications**: `bconsiteagentapp` and `bcoracleagentapp` with shared logic
- **Environment-based Configuration**: Separate .env files for prod/dev/qa environments
- **Centralized Logging**: All logs written to `logs/` directory with daily rotation
- **Enhanced Security**: Input validation, rate limiting, security headers, file protection
- **Apache Integration**: Clean URLs via .htaccess configuration
- **Health Monitoring**: Built-in health check endpoints
- **Rate Limiting**: Configurable per-IP rate limiting to prevent abuse
- **HTTPS Enforcement**: Automatic HTTPS redirect in production environments

## Directory Structure

```
BC_Agents/
├── .env.prod                    # Production environment variables
├── .env.dev                     # Development environment variables  
├── .env.qa                      # QA environment variables
├── .htaccess                    # Apache URL rewriting and security
├── settings/
│   └── app.ini.php             # Generic application settings
├── shared/
│   └── BCAgentCore.php         # Shared logic for both applications
├── logs/                       # Application logs (auto-created)
├── tmp/                        # Temporary files (auto-created)
├── bconsiteagentapp/
│   └── index.php               # BC Onsite Agent application
├── bcoracleagentapp/
│   └── index.php               # BC Oracle Agent application
├── tests/
│   └── test_bc_agents.php              # Comprehensive test suite
├── apache_php_config/          # Apache and PHP-FPM configuration files
│   ├── httpd.conf
│   ├── ssl.conf
│   ├── www.conf
│   └── backups/
└── docs/                       # Legacy documentation (consolidated here)
```

## Version 2.0.0 Improvements

### Architecture Enhancements
- **Environment-Based Configuration**: Migrated from config.ini.php files to .env files
- **Shared Logic**: Common functionality moved to `shared/BCAgentCore.php`
- **No Code Duplication**: Easier maintenance and updates
- **Application Auto-Detection**: Automatically detects application type from request path
- **Centralized Configuration Management**: Single configuration class handles all settings

### Security Enhancements
- **HTTPS Enforcement**: Automatically redirects HTTP requests to HTTPS in production
- **Security Headers**: Implements comprehensive security headers
  - `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
  - `X-Frame-Options: DENY` - Prevents clickjacking attacks
  - `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
  - `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- **Input Validation**: Strict validation of all input data including header values
- **Rate Limiting**: Prevents abuse with configurable rate limiting (default: 100 requests per hour per IP)
- **Secure Session IDs**: Uses cryptographically secure random session ID generation
- **SQL Injection Protection**: Enhanced prepared statement handling with proper error checking
- **File Protection**: Sensitive files protected from direct web access

### Error Handling & Logging
- **Comprehensive Logging**: Structured logging with different levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **Centralized Logging**: All logs written to `logs/` directory with daily rotation
- **Error Recovery**: Graceful error handling with user-friendly error messages
- **Database Error Handling**: Proper Oracle database error detection and logging
- **Exception Management**: Custom exception classes for better error categorization

### Performance & Reliability
- **Connection Management**: Proper database connection lifecycle management
- **Resource Cleanup**: Automatic cleanup of database resources and connections
- **Configuration Caching**: Configuration loaded once and cached for performance
- **Optimized Database Operations**: Improved SQL execution with proper error checking

## Quick Start

### 1. Deploy to Apache
```bash
# Copy to Apache document root
sudo cp -r BC_Agents /var/www/html/cac

# Set permissions
sudo chown -R www-data:www-data /var/www/html/cac
sudo find /var/www/html/cac -type d -exec chmod 755 {} \;
sudo find /var/www/html/cac -type f -exec chmod 644 {} \;

# Restrict access to sensitive files
sudo chmod 600 /var/www/html/cac/.env.*
sudo chmod 600 /var/www/html/cac/settings/app.ini.php
```

### 2. Configure Environment
```bash
# Set environment variable (in .htaccess)
# Edit .htaccess and change: SetEnv APP_ENV prod

# Update database credentials in .env.prod
sudo nano /var/www/html/cac/.env.prod
```

### 3. Enable Apache Modules
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 4. Test Applications
- BC Onsite Agent: `http://your-domain.com/bconsiteagentapp`
- BC Oracle Agent: `http://your-domain.com/bcoracleagentapp`
- Health Checks: `http://your-domain.com/bconsiteagentapp/health`

## Configuration

### Environment Variables (.env files)

The application uses environment-specific configuration files:

```bash
# Database Configuration
DB_CONN=your_database_connection_string
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Oracle Wallet Authentication (set to true to skip password validation)
USE_WALLET_AUTH=false             # Enable Oracle Wallet authentication

# Application Configuration
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
ENVIRONMENT=production            # production, development, qa

# Security Configuration
ENABLE_RATE_LIMITING=true         # Enable/disable rate limiting
MAX_REQUESTS_PER_HOUR=100         # Maximum requests per hour per IP
ENABLE_HTTPS_REDIRECT=true        # Enable/disable HTTPS redirect

# Application Redirect URLs
BCONSITEAGENT_REDIRECT_URL=https://your-domain.com/bconsiteui/
BCORACLEAGENT_REDIRECT_URL=bcvbs://

# Agent Configuration
AGENT_MAP_EDI=DOD_EDI_PN_ID      # Header name for EDI PIN ID
AGENT_MAP_UNIQUE=UNIQUE_ID        # Header name for Unique ID
```

## Oracle Wallet Authentication

The application supports Oracle Wallet authentication, which allows secure database connections without storing passwords in configuration files. When wallet authentication is enabled, the application will skip password validation during configuration loading.

### Features
- **Secure Authentication**: No passwords stored in configuration files
- **Environment Specific**: Can be enabled/disabled per environment
- **Backward Compatible**: Existing password-based authentication continues to work
- **Automatic Detection**: Application automatically adjusts validation based on wallet setting

### Configuration

#### Enabling Wallet Authentication
To enable Oracle Wallet authentication, set the following in your `.env` file:

```bash
# Enable Oracle Wallet authentication
USE_WALLET_AUTH=true

# Database configuration (password can be empty when using wallet)
DB_CONN=your_wallet_connection_string
DB_USER=your_database_user
DB_PASSWORD=                      # Can be empty when using wallet
```

#### Wallet Connection String Examples
```bash
# Standard wallet connection
DB_CONN=your_host:1521/your_service_name

# TNS alias with wallet
DB_CONN=your_tns_alias

# Full connection string with wallet location (if needed)
DB_CONN=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=your_host)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=your_service)))
```

### Setup Requirements

#### Oracle Wallet Setup
1. **Create Oracle Wallet**: Use Oracle Wallet Manager or `mkstore` command
2. **Add Database Credentials**: Store username/password in the wallet
3. **Configure TNS**: Update `tnsnames.ora` if using TNS aliases
4. **Set Wallet Location**: Configure `sqlnet.ora` with wallet location

#### Example sqlnet.ora Configuration
```
WALLET_LOCATION = (SOURCE = (METHOD = FILE) (METHOD_DATA = (DIRECTORY = /path/to/wallet)))
SQLNET.WALLET_OVERRIDE = TRUE
SSL_CLIENT_AUTHENTICATION = FALSE
SSL_VERSION = 0
```

#### Application Configuration
```bash
# In your .env file
USE_WALLET_AUTH=true
DB_CONN=your_connection_string
DB_USER=your_username
DB_PASSWORD=                      # Leave empty for wallet auth
```

### Security Benefits
- **No Password Storage**: Database passwords are not stored in configuration files
- **Encrypted Credentials**: Wallet stores credentials in encrypted format
- **Access Control**: Wallet files can be protected with file system permissions
- **Audit Trail**: Wallet access can be logged and monitored

### Environment-Specific Configuration

#### Production Environment
```bash
# .env.prod
USE_WALLET_AUTH=true              # Enable for production security
DB_CONN=prod_wallet_connection
DB_USER=prod_user
DB_PASSWORD=                      # Empty for wallet
```

#### Development Environment
```bash
# .env.dev
USE_WALLET_AUTH=false             # Use password for development convenience
DB_CONN=dev_connection
DB_USER=dev_user
DB_PASSWORD=dev_password          # Standard password authentication
```

### Troubleshooting Wallet Authentication

#### Common Issues

1. **Wallet Not Found**
   ```
   Error: ORA-12578: TNS:wallet open failed
   ```
   - Verify wallet location in `sqlnet.ora`
   - Check file permissions on wallet files
   - Ensure wallet directory is accessible to web server

2. **Invalid Wallet Password**
   ```
   Error: ORA-12579: TNS:wallet password incorrect
   ```
   - Verify wallet password (if auto-login is not enabled)
   - Check if wallet is configured for auto-login
   - Recreate wallet if password is lost

3. **Configuration Validation Error**
   ```
   Error: Missing required configuration key: database.db_password
   ```
   - Ensure `USE_WALLET_AUTH=true` is set in your `.env` file
   - Verify the environment file is being loaded correctly
   - Check that `APP_ENV` matches your environment file name

4. **Connection String Issues**
   ```
   Error: ORA-12154: TNS:could not resolve the connect identifier
   ```
   - Verify TNS alias exists in `tnsnames.ora`
   - Check connection string format
   - Test connection with `sqlplus` using same connection string

#### Diagnostic Steps

1. **Verify Wallet Configuration**
   ```bash
   # Test wallet with sqlplus
   sqlplus /@your_connection_string
   ```

2. **Check Application Logs**
   ```bash
   # Look for wallet authentication messages
   tail -f logs/bconsiteagent_$(date +%Y-%m-%d).log | grep -i wallet
   ```

3. **Validate Environment Configuration**
   ```bash
   # Check if USE_WALLET_AUTH is properly set
   grep USE_WALLET_AUTH .env.prod
   ```

4. **Test Database Connection**
   ```bash
   # Use health check endpoint
   curl https://your-domain.com/bconsiteagentapp/health
   ```

### Migration from Password to Wallet Authentication

#### Step-by-Step Migration

1. **Setup Oracle Wallet**
   - Create wallet with existing database credentials
   - Test wallet connection manually
   - Configure `sqlnet.ora` and `tnsnames.ora`

2. **Update Application Configuration**
   ```bash
   # Backup current configuration
   cp .env.prod .env.prod.backup
   
   # Update configuration
   echo "USE_WALLET_AUTH=true" >> .env.prod
   sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=/' .env.prod
   ```

3. **Test Configuration**
   ```bash
   # Test health endpoint
   curl https://your-domain.com/bconsiteagentapp/health
   
   # Check application logs
   tail -f logs/bconsiteagent_$(date +%Y-%m-%d).log
   ```

4. **Rollback Plan** (if needed)
   ```bash
   # Restore original configuration
   cp .env.prod.backup .env.prod
   ```

### Best Practices

- **Use Wallet in Production**: Always use wallet authentication in production environments
- **Secure Wallet Files**: Protect wallet files with appropriate file permissions (600 or 640)
- **Regular Wallet Rotation**: Periodically update wallet credentials
- **Monitor Access**: Log and monitor wallet access attempts
- **Backup Wallets**: Maintain secure backups of wallet files
- **Test Thoroughly**: Always test wallet configuration in non-production environments first

### Environment Selection

The environment is controlled by the `APP_ENV` variable in `.htaccess`:

```apache
# For Production
SetEnv APP_ENV prod

# For QA
SetEnv APP_ENV qa

# For Development
SetEnv APP_ENV dev
```

### Application Settings (settings/app.ini.php)

```ini
;<?php die(); ?>
[application]
app_name = BC_Agents
app_version = 2.0.0
log_level = INFO
log_retention_days = 30

[security]
session_timeout = 3600
max_login_attempts = 5
lockout_duration = 900

[performance]
cache_enabled = true
cache_ttl = 300
```

## Database Requirements

### Oracle Database Schema
The application requires an `edi` table with the following structure:

```sql
CREATE TABLE edi (
    ename VARCHAR2(255) PRIMARY KEY,
    evalue VARCHAR2(255) NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_edi_evalue ON edi(evalue);
CREATE INDEX idx_edi_created_at ON edi(created_at);
```

## Deployment Instructions

### Prerequisites
- PHP 7.4 or higher with OCI8 extension
- Oracle Database connectivity
- Apache web server with mod_rewrite and mod_headers
- HTTPS configured (recommended for production)
- Write permissions for logs and tmp directories

### Installation Steps

1. **Upload Files**
   ```bash
   # Upload all files to your web server directory
   scp -r BC_Agents user@server:/var/www/html/
   ```

2. **Set Permissions**
   ```bash
   # Set appropriate file permissions
   sudo chown -R www-data:www-data /var/www/html/BC_Agents
   sudo find /var/www/html/BC_Agents -type d -exec chmod 755 {} \;
   sudo find /var/www/html/BC_Agents -type f -exec chmod 644 {} \;
   
   # Restrict access to sensitive files
   sudo chmod 600 /var/www/html/BC_Agents/.env.*
   sudo chmod 600 /var/www/html/BC_Agents/settings/app.ini.php
   ```

3. **Configure Environment**
   ```bash
   # Edit .htaccess to set environment
   sudo nano /var/www/html/BC_Agents/.htaccess
   # Change: SetEnv APP_ENV prod
   
   # Update database credentials
   sudo nano /var/www/html/BC_Agents/.env.prod
   ```

4. **Configure Database**
   - Create the required database table (see schema above)
   - Update `.env.prod` with your database credentials

5. **Web Server Configuration**

   **Apache (.htaccess is included)**
   ```apache
   # Enable required modules
   sudo a2enmod rewrite
   sudo a2enmod headers
   sudo systemctl restart apache2
   ```

   **For Virtual Host (Optional):**
   ```apache
   <VirtualHost *:443>
       ServerName your-domain.com
       DocumentRoot /var/www/html/BC_Agents
       
       # SSL Configuration
       SSLEngine on
       SSLCertificateFile /path/to/certificate.crt
       SSLCertificateKeyFile /path/to/private.key
       
       # Set environment
       SetEnv APP_ENV prod
       
       # Enable .htaccess
       <Directory /var/www/html/BC_Agents>
           AllowOverride All
           Require all granted
       </Directory>
       
       # Security headers (server level)
       Header always set X-Content-Type-Options nosniff
       Header always set X-Frame-Options DENY
       Header always set X-XSS-Protection "1; mode=block"
       Header always set Referrer-Policy "strict-origin-when-cross-origin"
       
       ErrorLog ${APACHE_LOG_DIR}/bcagents_error.log
       CustomLog ${APACHE_LOG_DIR}/bcagents_access.log combined
   </VirtualHost>
   ```

6. **Test the Installation**
   ```bash
   # Test health endpoints
   curl https://your-domain.com/bconsiteagentapp/health
   curl https://your-domain.com/bcoracleagentapp/health
   
   # Test with headers (replace with your actual headers)
   curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bconsiteagentapp
   curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bcoracleagentapp
   ```

## Rate Limiting

The application implements configurable rate limiting to prevent abuse and ensure system stability.

### Features
- **Default Limit**: 100 requests per hour per IP address (configurable)
- **Per-IP Tracking**: Each IP address has its own request counter
- **Rolling Time Window**: Uses 1-hour rolling windows, not fixed hourly resets
- **Automatic Cleanup**: Old request records are automatically removed
- **Configurable**: Can be enabled/disabled and limits adjusted per environment
- **File-based Storage**: Uses `tmp/rate_limit_*.json` files for tracking
- **HTTP 429 Response**: Returns proper "Too Many Requests" status with Retry-After header

### Configuration
Rate limiting is controlled via environment variables:

```bash
# Enable or disable rate limiting
ENABLE_RATE_LIMITING=true

# Set maximum requests per hour per IP address
MAX_REQUESTS_PER_HOUR=100
```

### Environment-Specific Settings
- **Development**: Higher limits for testing (e.g., 500/hour)
- **QA**: Moderate limits (e.g., 200/hour)
- **Production**: Conservative limits (e.g., 100/hour)

## Testing

Run the comprehensive test suite to verify everything is working:

```bash
# Run the complete test suite
php tests/test_bc_agents.php
```

The test suite includes 9 comprehensive tests that verify:
- **File Structure and Deployment Readiness**: Checks all required files and directories exist
- **Environment Configuration Loading**: Tests .env file loading and configuration parsing
- **Application Configuration and Settings**: Validates app.ini.php and application auto-detection
- **Logging Functionality**: Tests all log levels and file creation
- **Input Validation and Security**: Comprehensive validation testing including XSS and injection prevention
- **Rate Limiting**: Tests rate limiting functionality with configurable limits
- **Session ID Generation**: Validates secure session ID generation and uniqueness
- **Database Connection Class**: Verifies database connection methods and OCI8 extension
- **Apache Configuration**: Validates .htaccess configuration and security directives

### Test Output
The test suite provides detailed output showing:
- ✓ PASSED tests with detailed information
- ✗ FAILED tests with specific error details
- Overall success rate and summary
- Next steps for deployment

### Running Tests
```bash
# Navigate to the tests directory and run
cd tests
php test_bc_agents.php

# Or run from the main directory
php tests/test_bc_agents.php
```

## Monitoring & Maintenance

### Health Check Endpoints
- `GET /bconsiteagentapp/health` - BC Onsite Agent health
- `GET /bcoracleagentapp/health` - BC Oracle Agent health

Health checks return JSON with:
```json
{
  "status": "healthy",
  "timestamp": 1634567890,
  "app": "bconsiteagent",
  "version": "2.0.0"
}
```

### Log Files
- BC Onsite Agent: `logs/bconsiteagent_YYYY-MM-DD.log`
- BC Oracle Agent: `logs/bcoracleagent_YYYY-MM-DD.log`

### Log Monitoring
- Monitor for ERROR and CRITICAL level messages
- Set up log rotation to prevent disk space issues
- Review access logs for suspicious patterns

### Log Rotation Setup
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/bcagents
```

```
/var/www/html/BC_Agents/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### Performance Monitoring
- Monitor database connection performance
- Watch for rate limiting triggers
- Monitor redirect response times

### Security Monitoring
- Monitor failed authentication attempts
- Check for unusual header patterns
- Review rate limiting violations

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Apache error logs: `tail -f /var/log/apache2/error.log`
   - Verify file permissions are correct
   - Ensure .htaccess configuration is valid
   - Confirm required Apache modules are enabled

2. **Database Connection Errors**
   - Check Oracle database connectivity
   - Verify OCI8 extension is installed: `php -m | grep oci8`
   - Confirm database credentials in .env file
   - Test database connection manually

3. **Permission Errors**
   - Ensure web server can write to `logs/` and `tmp/` directories
   - Check file permissions on configuration files
   - Verify ownership is set to web server user

4. **Header Not Found Errors**
   - Verify the client is sending required headers (DOD_EDI_PN_ID or UNIQUE_ID)
   - Check header name mapping in configuration
   - Review web server header forwarding configuration

5. **Rate Limit Exceeded**
   - Check rate limiting settings in .env file
   - Review rate limiting logs in application logs
   - Consider adjusting rate limits for your use case
   - Temporarily disable for testing: `ENABLE_RATE_LIMITING=false`

6. **Environment Configuration Issues**
   - Verify `APP_ENV` is set correctly in .htaccess
   - Check that corresponding .env file exists
   - Ensure .env file has correct format and values

7. **Oracle Wallet Authentication Issues**
   - **Error**: `Missing required configuration key: database.db_password`
     - Solution: Set `USE_WALLET_AUTH=true` in your `.env` file
     - Verify wallet is properly configured and accessible
     - Check that `DB_USER` and `DB_CONN` are still provided
   - **Error**: `BCOracleAgent Critical Error: Database connection failed`
     - Check wallet file permissions and location
     - Verify `sqlnet.ora` configuration
     - Test wallet connection with `sqlplus /@connection_string`

### Debug Mode
Set environment to 'development' for detailed error output:
```bash
# In .htaccess
SetEnv APP_ENV dev
```

For development/debugging, you can temporarily enable error display in the .env.dev file:
```bash
ENVIRONMENT=development
```
**Remember to disable this in production!**

### Service Restart Requirements

**Important: PHP code changes do NOT require service restarts**

**No Restart Required:**
- PHP application code changes (BCAgentCore.php, index.php files)
- .env file changes (loaded per request)
- Database credential updates
- Log file changes
- Application configuration changes

**Restart Required:**
- Apache configuration changes (httpd.conf, virtual hosts)
- .htaccess changes (depending on server configuration)
- PHP-FPM configuration changes (if using PHP-FPM)
- SSL certificate updates
- Apache module changes

```bash
# Only restart Apache when needed
sudo systemctl restart apache2

# Or reload for configuration changes
sudo systemctl reload apache2
```

### Diagnostic Commands
```bash
# Check PHP configuration
php -i | grep -E "(oci8|error_reporting|display_errors)"

# Check Apache modules
apache2ctl -M | grep -E "(rewrite|headers)"

# Check file permissions
ls -la /var/www/html/cac/
ls -la /var/www/html/cac/.env.*

# Check logs
tail -f /var/www/html/cac/logs/bconsiteagent_$(date +%Y-%m-%d).log
tail -f /var/log/apache2/error.log
```

## Security Considerations

### Production Checklist
- [ ] HTTPS is properly configured and enforced
- [ ] Database credentials are secure and not in version control
- [ ] Error display is disabled (`ENVIRONMENT=production`)
- [ ] Log files are not publicly accessible
- [ ] Configuration files are protected from direct access
- [ ] Regular security updates are applied
- [ ] Database access is restricted to application user only
- [ ] Rate limiting is properly configured
- [ ] Monitoring and alerting are in place
- [ ] File permissions are properly set (644 for files, 755 for directories)
- [ ] Environment variables are properly configured
- [ ] Security headers are implemented

### Security Headers Implemented
The application automatically sets the following security headers:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

## Migration from Legacy Structure

### Environment-Based Configuration Migration
The application has been successfully migrated from config.ini.php files to environment-based configuration:

- **✅ COMPLETED**: Migration from BC_ENVIRONMENT to APP_ENV
- **✅ COMPLETED**: Removal of config.ini.php dependency
- **✅ COMPLETED**: Environment-specific .env files
- **✅ COMPLETED**: Application auto-detection
- **✅ COMPLETED**: Backward compatible API

### Benefits of New Architecture
1. **Better Organization**: Separate directories for each application
2. **Shared Logic**: Common code in `shared/BCAgentCore.php`
3. **Environment Configuration**: .env files instead of .ini.php
4. **Enhanced Security**: Multiple security improvements
5. **Apache Integration**: Clean URLs and better web server integration
6. **Centralized Configuration**: Single source of truth per environment

## API Reference

### Core Classes

#### BCAgentApp
Main application class that handles request processing.

```php
$app = new BCAgentApp($configPath, $appName);
$app->run();
```

#### Config
Configuration management class.

```php
// Load configuration
$config = Config::load($configPath);

// Get configuration values
$dbConfig = Config::get('database');
$redirectUrl = Config::get('application', 'app_redirect_url');
```

#### Logger
Logging functionality with multiple levels.

```php
Logger::init($appName, $logLevel);
Logger::info('Message', ['context' => 'data']);
Logger::error('Error message', ['error' => $exception->getMessage()]);
```

#### Database
Database connection management.

```php
$connection = Database::connect();
// Use connection...
Database::disconnect();
```

## Production Deployment

### **IMPORTANT: Do NOT deploy the entire project to production**

For production deployment, only deploy essential files. The project includes deployment tools to help with this:

### **Quick Production Deployment**

1. **Run the deployment script:**
   ```bash
   # Linux/Mac
   bash deploy_production.sh
   
   # Windows
   deploy_production.bat
   ```

2. **Upload the generated archive** to your production server

3. **Follow the deployment checklist** in `PRODUCTION_DEPLOYMENT_CHECKLIST.md`

### **Files Included in Production Package:**
- `.env.prod` - Production environment configuration
- `.htaccess` - Apache configuration
- `README.md` - Documentation
- `settings/` - Application settings
- `shared/` - Core application logic
- `bconsiteagentapp/` - BC Onsite Agent application
- `bcoracleagentapp/` - BC Oracle Agent application
- `logs/` and `tmp/` - Auto-created directories

### **Files EXCLUDED from Production:**
- `docs/` - Documentation files (security risk)
- `tests/` - Test scripts (security risk)
- `.env.dev`, `.env.qa` - Development environment files
- `apache_php_config/` - Server configuration files
- Development logs and temporary files

### **Production Security Benefits:**
- Reduced attack surface
- No exposure of test scripts or development configurations
- Proper file permissions automatically set
- Environment automatically configured for production

For detailed deployment instructions, see `PRODUCTION_DEPLOYMENT_CHECKLIST.md`.

## Support

For issues or questions:
1. Check the application logs first
2. Review this documentation
3. Use test scripts to verify functionality (`php tests/test_bc_agents.php`)
4. Check Apache error logs
5. Review the production deployment checklist
6. Contact the Blood Center Development Team

## License

Internal use only - Blood Center Development Team

---

**Version**: 2.0.0  
**Last Updated**: November 2025  
**Maintained by**: Blood Center Development Team
