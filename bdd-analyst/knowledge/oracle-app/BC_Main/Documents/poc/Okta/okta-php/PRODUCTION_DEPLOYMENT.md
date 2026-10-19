# Production Deployment Guide

This guide outlines the steps required to deploy this application to a production environment.

## Prerequisites

- PHP 7.4 or higher
- Apache web server with mod_rewrite enabled
- Required PHP extensions: oci8, curl, json, openssl
- SSL certificate for HTTPS
- Oracle database access

## Deployment Steps

### 1. Upload Files to Production Server

Transfer all application files to your production server using your preferred method (FTP, SCP, Git, etc.):

```bash
# Example using SCP
scp -r /path/to/local/app/* user@production-server:/path/to/web/root/

# Example using rsync
rsync -avz --exclude='.git' --exclude='logs/*.log' /path/to/local/app/ user@production-server:/path/to/web/root/
```

### 2. Configure Environment Settings

Ensure your `.env.prod` file has the correct production settings:

```bash
# Copy the example file if needed
cp .env.example .env.prod

# Edit the file with production values
nano .env.prod
```

Make sure the following settings are properly configured:

```
APP_ENV=prod
APP_DEBUG=false
SECURE_COOKIES=true
BASE_HREF=/okta/
```

The `BASE_HREF` setting is particularly important as it ensures proper URL path handling when the application is deployed in a subdirectory. Without this setting, links and resources may not load correctly.

Also verify that all database credentials, Okta settings, and other configuration values are set correctly for your production environment.

### 3. Configure HTTPS

Ensure your web server is configured to use HTTPS:

1. Install an SSL certificate on your web server
2. Configure your virtual host to use HTTPS
3. Verify that the `.htaccess` file contains the HTTPS redirect rules

Example Apache virtual host configuration:

```apache
<VirtualHost *:443>
    ServerName example.com
    DocumentRoot /path/to/web/root
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt
    
    <Directory /path/to/web/root>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### 4. Set File Permissions

Set the correct file permissions to ensure security and proper operation:

```bash
# Protect sensitive configuration files
chmod 600 .env.prod

# Make logs directory writable
chmod 755 logs
chmod 644 logs/app.log
```

### 5. Run the Deployment Verification Script

Execute the appropriate deployment script to verify your setup:

```bash
# For production environment
php deploy.php

# For QA environment
php deploy_qa.php

# For development environment
php deploy_dev.php
```

These scripts will check:
- Environment configuration
- HTTPS setup (for production and QA)
- File permissions
- PHP requirements
- Database connection
- Okta configuration

Each script has environment-specific checks and expectations. For example:
- Production script enforces strict security settings
- QA script allows some warnings but ensures production-like configuration
- Development script is more permissive with security settings

Fix any critical issues reported by the scripts before proceeding.

### 6. Final Verification

After the deployment script passes, perform these final checks:

1. Test authentication flows for both applications:
   - Onsite application: https://your-domain.com/bconsiteapp/
   - Oracle application: https://your-domain.com/bcoracleapp/

2. Verify logs are being written correctly:
   ```bash
   tail -f logs/app.log
   ```

3. Check for any PHP errors in your web server's error log:
   ```bash
   tail -f /path/to/apache/error.log
   ```

## Troubleshooting

### Common Issues

1. **"Could not load .env.prod file"**
   - Verify the file exists and is readable by the web server
   - Check file permissions

2. **"Database connection failed"**
   - Verify database credentials in .env.prod
   - Check network connectivity to the database server
   - Ensure the oci8 extension is properly installed

3. **"Okta connection error"**
   - Verify Okta credentials and URLs in .env.prod
   - Check network connectivity to Okta services
   - Ensure SSL verification settings are correct

4. **HTTPS not working**
   - Verify SSL certificate installation
   - Check Apache/web server configuration
   - Ensure .htaccess is enabled (AllowOverride All)

### Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs in `logs/app.log`
2. Review the web server error logs
3. Consult the [DEPLOY.md](DEPLOY.md) file for additional deployment information

## Post-Deployment Maintenance

### Regular Maintenance Tasks

1. **Monitor logs regularly**:
   ```bash
   tail -f logs/app.log
   ```

2. **Check for PHP and dependency updates**:
   - Keep PHP updated to the latest secure version
   - Update any dependencies as needed

3. **SSL certificate renewal**:
   - Monitor SSL certificate expiration dates
   - Renew certificates before they expire

4. **Database maintenance**:
   - Regularly backup the database
   - Monitor database performance

### Security Best Practices

1. Keep all software components updated
2. Regularly review file permissions
3. Monitor for unauthorized access attempts
4. Consider implementing a Web Application Firewall (WAF)
5. Perform regular security audits
