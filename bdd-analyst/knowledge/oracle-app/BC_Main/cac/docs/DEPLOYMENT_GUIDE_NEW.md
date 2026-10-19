# BC_Agents Deployment Guide

## Overview
This guide provides instructions for deploying the BC_Agents application to an Apache web server on Linux.

## Directory Structure
```
BC_Agents/
├── .env.prod                    # Production environment variables
├── .env.dev                     # Development environment variables
├── .env.qa                      # QA environment variables
├── .htaccess                    # Apache configuration
├── settings/
│   └── app.ini.php             # Generic application settings
├── shared/
│   └── BCAgentCore.php         # Shared logic for both applications
├── logs/                       # Application logs directory
├── tmp/                        # Temporary files directory
├── bconsiteagentapp/
│   ├── index.php               # BC Onsite Agent application
│   └── config.ini.php          # BC Onsite Agent configuration
└── bcoracleagentapp/
    ├── index.php               # BC Oracle Agent application
    └── config.ini.php          # BC Oracle Agent configuration
```

## Deployment Steps

### 1. Copy Files to Apache Document Root
```bash
# Copy the entire BC_Agents directory to /var/www/html/
sudo cp -r BC_Agents /var/www/html/
```

### 2. Set Proper Permissions
```bash
# Set ownership to Apache user (usually www-data or apache)
sudo chown -R www-data:www-data /var/www/html/BC_Agents

# Set directory permissions
sudo find /var/www/html/BC_Agents -type d -exec chmod 755 {} \;

# Set file permissions
sudo find /var/www/html/BC_Agents -type f -exec chmod 644 {} \;

# Make logs and tmp directories writable
sudo chmod 755 /var/www/html/BC_Agents/logs
sudo chmod 755 /var/www/html/BC_Agents/tmp
```

### 3. Configure Environment
Set the environment variable to determine which .env file to use:

#### For Production:
```bash
# Add to Apache virtual host or .htaccess
SetEnv BC_ENVIRONMENT prod
```

#### For Development:
```bash
SetEnv BC_ENVIRONMENT dev
```

#### For QA:
```bash
SetEnv BC_ENVIRONMENT qa
```

### 4. Update Environment Files
Edit the appropriate .env file with your actual database credentials:

```bash
# Edit production environment file
sudo nano /var/www/html/BC_Agents/.env.prod
```

Update the database connection details:
```
DB_CONN=your_database_connection_string
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

### 5. Apache Configuration
Ensure Apache has the following modules enabled:
```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 6. Virtual Host Configuration (Optional)
If you want to create a dedicated virtual host:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html/BC_Agents
    
    # Set environment
    SetEnv BC_ENVIRONMENT prod
    
    # Enable .htaccess
    <Directory /var/www/html/BC_Agents>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Security: Deny access to sensitive directories
    <Directory /var/www/html/BC_Agents/shared>
        Require all denied
    </Directory>
    
    <Directory /var/www/html/BC_Agents/settings>
        Require all denied
    </Directory>
    
    <Directory /var/www/html/BC_Agents/logs>
        Require all denied
    </Directory>
    
    <Directory /var/www/html/BC_Agents/tmp>
        Require all denied
    </Directory>
    
    # Deny access to configuration files
    <FilesMatch "\.(ini|env|log)$">
        Require all denied
    </FilesMatch>
    
    ErrorLog ${APACHE_LOG_DIR}/bcagents_error.log
    CustomLog ${APACHE_LOG_DIR}/bcagents_access.log combined
</VirtualHost>
```

## Application URLs

After deployment, the applications will be accessible at:

- **BC Onsite Agent App**: `http://your-domain.com/bconsiteagentapp`
- **BC Oracle Agent App**: `http://your-domain.com/bcoracleagentapp`

### Health Check Endpoints
- **BC Onsite Health**: `http://your-domain.com/bconsiteagentapp/health`
- **BC Oracle Health**: `http://your-domain.com/bcoracleagentapp/health`

## Configuration

### Environment Variables (.env files)
- `DB_CONN`: Database connection string
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `ENVIRONMENT`: Environment name (production, development, qa)
- `ENABLE_RATE_LIMITING`: Enable/disable rate limiting (true/false)
- `MAX_REQUESTS_PER_HOUR`: Maximum requests per hour per IP
- `ENABLE_HTTPS_REDIRECT`: Enable/disable HTTPS redirect (true/false)

### Application Settings (settings/app.ini.php)
- `app_name`: Application name
- `app_version`: Application version
- `log_level`: Default log level
- `log_retention_days`: Log retention period

### Agent Configuration (per application)
Each application has its own `config.ini.php` file with:
- Database connection details (overridden by environment variables)
- Application redirect URL
- Header mapping for agent identification

## Logging

Logs are written to the `logs/` directory with the following naming convention:
- BC Onsite Agent: `bconsiteagent_YYYY-MM-DD.log`
- BC Oracle Agent: `bcoracleagent_YYYY-MM-DD.log`

## Security Features

1. **Input Validation**: All header inputs are validated and sanitized
2. **Rate Limiting**: Configurable rate limiting per IP address
3. **Security Headers**: Automatic security headers (X-Frame-Options, etc.)
4. **HTTPS Redirect**: Optional HTTPS enforcement
5. **File Protection**: Sensitive files are protected via .htaccess
6. **Error Handling**: Comprehensive error handling and logging

## Troubleshooting

### Check Logs
```bash
# View application logs
tail -f /var/www/html/BC_Agents/logs/bconsiteagent_$(date +%Y-%m-%d).log
tail -f /var/www/html/BC_Agents/logs/bcoracleagent_$(date +%Y-%m-%d).log

# View Apache error logs
tail -f /var/log/apache2/error.log
```

### Test Health Endpoints
```bash
# Test BC Onsite Agent
curl http://your-domain.com/bconsiteagentapp/health

# Test BC Oracle Agent
curl http://your-domain.com/bcoracleagentapp/health
```

### Common Issues

1. **500 Internal Server Error**: Check Apache error logs and file permissions
2. **Database Connection Failed**: Verify database credentials in .env file
3. **Rate Limit Exceeded**: Check rate limiting settings or disable for testing
4. **Headers Not Found**: Ensure client is sending required headers (DOD_EDIPN_ID or UNIQUE_ID)

## Maintenance

### Log Rotation
Consider setting up log rotation for the application logs:

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

### Monitoring
Monitor the health endpoints regularly to ensure applications are running properly.
