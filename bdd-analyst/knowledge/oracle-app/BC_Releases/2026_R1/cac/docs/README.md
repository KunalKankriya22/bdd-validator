# BC_Agents - Blood Center Agent Application

## Overview

BC_Agents is a production-ready PHP application that handles authentication redirects for blood center agents. It extracts user identification from request headers, stores session data in an Oracle database, and redirects users to the appropriate application URL.

This restructured version (v2.0.0) provides improved security, maintainability, and deployment flexibility with dual applications sharing common logic.

## Features

- **Dual Applications**: `bconsiteagentapp` and `bcoracleagentapp` with shared logic
- **Environment-based Configuration**: Separate .env files for prod/dev/qa environments
- **Centralized Logging**: All logs written to `logs/` directory
- **Enhanced Security**: Input validation, rate limiting, security headers, file protection
- **Apache Integration**: Clean URLs via .htaccess configuration
- **Health Monitoring**: Built-in health check endpoints

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
│   ├── test_core_functionality.php      # Core functionality tests
│   └── test_deployment_structure.php    # Deployment structure tests
└── docs/
    ├── README.md               # This documentation
    ├── DEPLOYMENT_GUIDE_NEW.md # Detailed deployment instructions
    └── BC_ENVIRONMENT_CONFIGURATION.md
```

## Version 2.0.0 Improvements

### Security Enhancements
- **HTTPS Enforcement**: Automatically redirects HTTP requests to HTTPS in production
- **Security Headers**: Implements comprehensive security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- **Input Validation**: Strict validation of all input data including header values
- **Rate Limiting**: Prevents abuse with configurable rate limiting (default: 100 requests per hour per IP)
- **Secure Session IDs**: Uses cryptographically secure random session ID generation
- **SQL Injection Protection**: Enhanced prepared statement handling with proper error checking

### Architecture Improvements
- **Shared Logic**: Common functionality moved to `shared/BCAgentCore.php`
- **No Code Duplication**: Easier maintenance and updates
- **Environment-based Configuration**: Separate .env files for different environments
- **Database Credentials Security**: Stored securely outside code
- **Easy Environment Switching**: Via environment variables

### Error Handling & Logging
- **Comprehensive Logging**: Structured logging with different levels (INFO, ERROR, CRITICAL)
- **Centralized Logging**: All logs written to `logs/` directory
- **Error Recovery**: Graceful error handling with user-friendly error messages
- **Database Error Handling**: Proper Oracle database error detection and logging
- **Exception Management**: Custom exception classes for better error categorization

### Performance & Reliability
- **Connection Management**: Proper database connection lifecycle management
- **Resource Cleanup**: Automatic cleanup of database resources and connections
- **Configuration Caching**: Configuration loaded once and cached for performance
- **Optimized Database Operations**: Improved SQL execution with proper error checking

### Code Quality
- **Object-Oriented Design**: Modular, maintainable code structure
- **PSR Standards**: Following PHP coding standards
- **Documentation**: Comprehensive inline documentation
- **Separation of Concerns**: Clear separation between configuration, database, validation, and business logic

## Quick Start

### 1. Deploy to Apache
```bash
# Copy to Apache document root
sudo cp -r BC_Agents /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/BC_Agents
sudo find /var/www/html/BC_Agents -type d -exec chmod 755 {} \;
sudo find /var/www/html/BC_Agents -type f -exec chmod 644 {} \;
```

### 2. Configure Environment
```bash
# Set environment variable (in Apache virtual host or .htaccess)
SetEnv BC_ENVIRONMENT prod

# Update database credentials in .env.prod
sudo nano /var/www/html/BC_Agents/.env.prod
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
```bash
# Database Configuration
DB_CONN=your_database_connection_string
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# Application Configuration
LOG_LEVEL=INFO
ENVIRONMENT=production

# Security Configuration
ENABLE_RATE_LIMITING=true
MAX_REQUESTS_PER_HOUR=100
ENABLE_HTTPS_REDIRECT=true

# Application Redirect URLs
BCONSITEAGENT_REDIRECT_URL=https://your-domain.com/bconsiteui/
BCORACLEAGENT_REDIRECT_URL=bcvbs://

# Agent Configuration
AGENT_MAP_EDI=DOD_EDI_PN_ID
AGENT_MAP_UNIQUE=UNIQUE_ID
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

### Configuration Security
- The PHP die() statement at the top prevents direct access to configuration files
- Database credentials stored securely in environment variables
- Sensitive configuration protected from direct web access

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
- PHP 7.4 or higher
- Oracle Database with OCI8 extension
- Web server (Apache/Nginx) with HTTPS configured
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

3. **Configure Database**
   - Create the required database table (see schema above)
   - Update `.env.prod` with your database credentials

4. **Web Server Configuration**

   **Apache (.htaccess)**
   ```apache
   # Force HTTPS
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   
   # Clean URL rewriting
   RewriteRule ^bconsiteagentapp/?$ bconsiteagentapp/index.php [L]
   RewriteRule ^bcoracleagentapp/?$ bcoracleagentapp/index.php [L]
   
   # Security headers
   Header always set X-Content-Type-Options nosniff
   Header always set X-Frame-Options DENY
   Header always set X-XSS-Protection "1; mode=block"
   Header always set Referrer-Policy "strict-origin-when-cross-origin"
   
   # Protect sensitive files
   <Files ".env.*">
       Order allow,deny
       Deny from all
   </Files>
   
   <Files "*.ini.php">
       Order allow,deny
       Deny from all
   </Files>
   ```

   **Nginx**
   ```nginx
   location ~ /\.env {
       deny all;
   }
   
   location ~ \.ini\.php$ {
       deny all;
   }
   
   location /bconsiteagentapp {
       try_files $uri $uri/ /bconsiteagentapp/index.php;
   }
   
   location /bcoracleagentapp {
       try_files $uri $uri/ /bcoracleagentapp/index.php;
   }
   ```

5. **Test the Installation**
   ```bash
   # Test with curl (replace with your actual headers)
   curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bconsiteagentapp
   curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bcoracleagentapp
   ```

## Rate Limiting

The application implements configurable rate limiting to prevent abuse and ensure system stability.

### Features
- **Default Limit**: 100 requests per hour per IP address (configurable via environment variables)
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

### Customizing Rate Limits
You can customize rate limiting in two ways:

1. **Via Environment Variables** (Recommended):
```ini
# In your .env file
MAX_REQUESTS_PER_HOUR=200
ENABLE_RATE_LIMITING=true
```

2. **Programmatically** (for special cases):
```php
if (!RateLimiter::checkLimit($clientIp, 200, 3600)) { // 200 requests per hour
```

### Monitoring Rate Limits
- Rate limit violations are logged with IP addresses
- Check `logs/` directory for rate limiting events
- Monitor `tmp/rate_limit_*.json` files for current usage

## Testing

Run the test scripts to verify everything is working:

```bash
# Test core functionality
php tests/test_core_functionality.php

# Test deployment structure
php tests/test_deployment_structure.php
```

The test scripts verify:
- File structure integrity
- Environment configuration loading
- Application configuration loading
- Logging functionality
- Input validation
- Rate limiting
- All core features

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
   - Check Apache error logs and file permissions
   - Verify .htaccess configuration
   - Ensure required Apache modules are enabled

2. **Database Connection Errors**
   - Check Oracle database connectivity
   - Verify OCI8 extension is installed
   - Confirm database credentials in .env file

3. **Permission Errors**
   - Ensure web server can write to `logs/` and `tmp/` directories
   - Check file permissions on configuration files

4. **Header Not Found Errors**
   - Verify the client is sending required headers (DOD_EDI_PN_ID or UNIQUE_ID)
   - Check header name mapping in configuration
   - Review web server header forwarding configuration

5. **Rate Limit Exceeded**
   - Check rate limiting settings or disable for testing
   - Review rate limiting logs
   - Consider adjusting rate limits for your use case

6. **Rate Limiting Not Working**
   - Ensure `tmp/` directory is writable by web server
   - Check ENABLE_RATE_LIMITING setting in .env file

### Debug Mode
Set environment to 'development' for detailed error output:
```bash
SetEnv BC_ENVIRONMENT dev
```

For development/debugging, you can temporarily enable error display:
```php
ini_set('display_errors', '1'); // Change from '0' to '1'
```
**Remember to disable this in production!**

## Security Considerations

### Production Checklist
- [ ] HTTPS is properly configured and enforced
- [ ] Database credentials are secure and not in version control
- [ ] Error display is disabled (`display_errors = '0'`)
- [ ] Log files are not publicly accessible
- [ ] Configuration files are protected from direct access
- [ ] Regular security updates are applied
- [ ] Database access is restricted to application user only
- [ ] Rate limiting is properly configured
- [ ] Monitoring and alerting are in place
- [ ] File permissions are properly set
- [ ] Environment variables are properly configured

### Security Headers Implemented
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

## Migration from Legacy Structure

The old files (`bcagentapp.php`, `bcoracleagentapp.php`, etc.) are preserved but no longer used. The new structure provides:

1. **Better Organization**: Separate directories for each application
2. **Shared Logic**: Common code in `shared/BCAgentCore.php`
3. **Environment Configuration**: .env files instead of .ini.php
4. **Enhanced Security**: Multiple security improvements
5. **Apache Integration**: Clean URLs and better web server integration

## Support

For issues or questions:
1. Check the application logs first
2. Review this documentation
3. Refer to `docs/DEPLOYMENT_GUIDE_NEW.md` for detailed deployment instructions
4. Use test scripts to verify functionality
5. Contact the Blood Center Development Team

## License

Internal use only - Blood Center Development Team
