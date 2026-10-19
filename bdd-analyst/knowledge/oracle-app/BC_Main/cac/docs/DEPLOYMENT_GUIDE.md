# Blood Center Agent Application - Deployment Guide

## Configuration File Location Options

The application now supports multiple configuration file locations for enhanced security. The system will automatically search for the configuration file in the following order:

### 1. Environment Variable (Most Secure) ⭐ RECOMMENDED
Set the `BCAGENT_CONFIG` environment variable to point to your configuration file:

```bash
# Linux/Unix
export BCAGENT_CONFIG="/etc/bcagent/bcagentapp.ini.php"

# Windows
set BCAGENT_CONFIG=C:\config\bcagentapp.ini.php
```

**Directory Structure:**
```
/etc/bcagent/
└── bcagentapp.ini.php

/var/www/html/
└── bcagentapp.php
```

**Advantages:**
- Configuration completely outside web root
- Can be managed by system administrators
- Supports different configs per environment
- Most secure option

### 2. Outside Web Root (Recommended)
Place the configuration file one level above the web root:

**Directory Structure:**
```
/var/www/
├── config/
│   └── bcagentapp.ini.php
└── html/
    └── bcagentapp.php
```

**Advantages:**
- Configuration not web-accessible
- Simple to implement
- Good security

### 3. Protected Config Directory
Create a protected `config` directory within your web root:

**Directory Structure:**
```
/var/www/html/
├── bcagentapp.php
├── config/
│   └── bcagentapp.ini.php
└── .htaccess
```

**Required .htaccess file:**
```apache
# Protect config directory
<Directory "config">
    Order deny,allow
    Deny from all
</Directory>

# Alternative: Protect all .ini.php files
<Files "*.ini.php">
    Order deny,allow
    Deny from all
</Files>
```

**For Nginx, add to your server block:**
```nginx
location ~* /config/ {
    deny all;
}

# Alternative: Protect all .ini.php files
location ~* \.ini\.php$ {
    deny all;
}
```

### 4. Same Directory (Fallback)
Keep the configuration file in the same directory as the application:

**Directory Structure:**
```
/var/www/html/
├── bcagentapp.php
└── bcagentapp.ini.php
```

**⚠️ Security Note:** This option requires proper web server configuration to protect the .ini.php file.

## Deployment Steps by Option

### Option 1: Environment Variable (Recommended)

1. **Create secure config directory:**
   ```bash
   sudo mkdir -p /etc/bcagent
   sudo chmod 755 /etc/bcagent
   ```

2. **Copy configuration file:**
   ```bash
   sudo cp bcagentapp.ini.php /etc/bcagent/
   sudo chmod 600 /etc/bcagent/bcagentapp.ini.php
   sudo chown www-data:www-data /etc/bcagent/bcagentapp.ini.php
   ```

3. **Set environment variable:**
   
   **For Apache (in virtual host or .htaccess):**
   ```apache
   SetEnv BCAGENT_CONFIG "/etc/bcagent/bcagentapp.ini.php"
   ```
   
   **For Nginx (in server block):**
   ```nginx
   location ~ \.php$ {
       fastcgi_param BCAGENT_CONFIG "/etc/bcagent/bcagentapp.ini.php";
       # ... other fastcgi_param directives
   }
   ```
   
   **For system-wide (in /etc/environment):**
   ```bash
   echo 'BCAGENT_CONFIG="/etc/bcagent/bcagentapp.ini.php"' | sudo tee -a /etc/environment
   ```

4. **Deploy application:**
   ```bash
   cp bcagentapp.php /var/www/html/
   ```

### Option 2: Outside Web Root

1. **Create config directory:**
   ```bash
   sudo mkdir -p /var/www/config
   sudo chmod 755 /var/www/config
   ```

2. **Copy files:**
   ```bash
   sudo cp bcagentapp.ini.php /var/www/config/
   sudo chmod 600 /var/www/config/bcagentapp.ini.php
   sudo chown www-data:www-data /var/www/config/bcagentapp.ini.php
   
   cp bcagentapp.php /var/www/html/
   ```

### Option 3: Protected Config Directory

1. **Create config directory:**
   ```bash
   mkdir -p /var/www/html/config
   ```

2. **Copy files:**
   ```bash
   cp bcagentapp.ini.php /var/www/html/config/
   cp bcagentapp.php /var/www/html/
   ```

3. **Create .htaccess protection:**
   ```bash
   cat > /var/www/html/.htaccess << 'EOF'
   # Protect configuration files
   <Files "*.ini.php">
       Order deny,allow
       Deny from all
   </Files>
   
   # Protect config directory
   <Directory "config">
       Order deny,allow
       Deny from all
   </Directory>
   EOF
   ```

### Option 4: Same Directory (Simple)

1. **Copy files:**
   ```bash
   cp bcagentapp.php bcagentapp.ini.php /var/www/html/
   ```

2. **Create .htaccess protection:**
   ```bash
   cat > /var/www/html/.htaccess << 'EOF'
   <Files "*.ini.php">
       Order deny,allow
       Deny from all
   </Files>
   EOF
   ```

## Security Verification

After deployment, verify your configuration file is protected:

```bash
# Test that config file is not accessible via web
curl -I https://yourdomain.com/bcagentapp.ini.php
# Should return 403 Forbidden or 404 Not Found

curl -I https://yourdomain.com/config/bcagentapp.ini.php
# Should return 403 Forbidden or 404 Not Found
```

## File Permissions

Set appropriate file permissions:

```bash
# Application file
chmod 644 bcagentapp.php

# Configuration file (more restrictive)
chmod 600 bcagentapp.ini.php

# Ensure web server can read
chown www-data:www-data bcagentapp.php bcagentapp.ini.php

# Create required directories
mkdir -p logs tmp
chmod 755 logs tmp
chown www-data:www-data logs tmp
```

## Testing Configuration

Test that the application can find your configuration:

```bash
# Check application health
curl https://yourdomain.com/bcagentapp.php/health

# Should return:
# {"status":"healthy","timestamp":1234567890}
```

## Environment-Specific Configurations

You can maintain different configurations for different environments:

```bash
# Development
export BCAGENT_CONFIG="/etc/bcagent/dev.ini.php"

# Staging
export BCAGENT_CONFIG="/etc/bcagent/staging.ini.php"

# Production
export BCAGENT_CONFIG="/etc/bcagent/prod.ini.php"
```

## Troubleshooting

### Configuration Not Found
If you see "Configuration file not found in any expected location":

1. Check file exists: `ls -la /path/to/bcagentapp.ini.php`
2. Check permissions: `ls -la /path/to/bcagentapp.ini.php`
3. Check environment variable: `echo $BCAGENT_CONFIG`
4. Check web server error logs

### Permission Denied
If you see "Configuration file not readable":

1. Check file permissions: `chmod 644 bcagentapp.ini.php`
2. Check ownership: `chown www-data:www-data bcagentapp.ini.php`
3. Check directory permissions

### Configuration Parse Error
If you see "Failed to parse configuration file":

1. Check file syntax: `php -l bcagentapp.ini.php`
2. Verify INI format is correct
3. Check for special characters in values

## Best Practices Summary

1. **Use environment variables** for production deployments
2. **Never store configuration in version control** with real credentials
3. **Use restrictive file permissions** (600 for config files)
4. **Test configuration accessibility** via web browser
5. **Monitor logs** for configuration-related errors
6. **Use different configs** for different environments
7. **Backup configuration files** securely

## Migration from Current Setup

If you currently have `bcagentapp.ini.php` in the same directory as `bcagentapp.php`:

1. **Choose your preferred option** from above
2. **Move the configuration file** to the new location
3. **Update file permissions** as needed
4. **Test the application** to ensure it finds the config
5. **Remove the old configuration file** from the web directory

The application will automatically find your configuration file in the new location without any code changes.
