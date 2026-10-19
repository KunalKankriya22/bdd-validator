# BC_Agents Production Deployment Checklist

## Pre-Deployment Preparation

### ✅ **Development Environment**
- [ ] All tests pass successfully (`php tests/test_bc_agents.php`)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version tagged in source control

### ✅ **Production Environment Setup**
- [ ] Production server meets requirements:
  - [ ] PHP 7.4+ with OCI8 extension
  - [ ] Apache with mod_rewrite and mod_headers enabled
  - [ ] Oracle Database connectivity
  - [ ] HTTPS configured and working
- [ ] Database schema created with required `edi` table
- [ ] Production database credentials obtained
- [ ] Backup strategy in place

## Deployment Process

### ✅ **Step 1: Create Production Package**
Choose your deployment method:

**Option A: Using Deployment Script (Recommended)**
- [ ] Run deployment script:
  - Linux/Mac: `bash deploy_production.sh`
  - Windows: `deploy_production.bat`
- [ ] Verify package contents in `bc_agents_production/` directory
- [ ] Confirm archive created successfully

**Option B: Manual Package Creation**
- [ ] Create production directory structure
- [ ] Copy only essential files:
  - [ ] `.env.prod`
  - [ ] `.htaccess`
  - [ ] `README.md`
  - [ ] `settings/` directory
  - [ ] `shared/` directory
  - [ ] `bconsiteagentapp/` directory
  - [ ] `bcoracleagentapp/` directory
- [ ] Create empty `logs/` and `tmp/` directories
- [ ] Set `APP_ENV=prod` in `.htaccess`

### ✅ **Step 2: Upload to Production Server**
- [ ] Upload production package to server
- [ ] Extract to temporary location
- [ ] Verify all files uploaded correctly

### ✅ **Step 3: Configure Production Environment**
- [ ] Move files to web directory: `/var/www/html/cac/`
- [ ] Set proper file ownership:
  ```bash
  sudo chown -R www-data:www-data /var/www/html/cac
  ```
- [ ] Set correct file permissions:
  ```bash
  sudo find /var/www/html/cac -type d -exec chmod 755 {} \;
  sudo find /var/www/html/cac -type f -exec chmod 644 {} \;
  sudo chmod 600 /var/www/html/cac/.env.prod
  ```

### ✅ **Step 4: Update Configuration**
- [ ] Edit `.env.prod` with production database credentials:
  - [ ] `DB_CONN` - Production database connection string
  - [ ] `DB_USER` - Production database username
  - [ ] `DB_PASSWORD` - Production database password
- [ ] Verify `.htaccess` has `SetEnv APP_ENV prod`
- [ ] Confirm redirect URLs are correct for production:
  - [ ] `BCONSITEAGENT_REDIRECT_URL`
  - [ ] `BCORACLEAGENT_REDIRECT_URL`

### ✅ **Step 5: Apache Configuration**
- [ ] Ensure required Apache modules are enabled:
  ```bash
  sudo a2enmod rewrite
  sudo a2enmod headers
  ```
- [ ] Configure virtual host (if needed)
- [ ] Set up SSL certificates
- [ ] Restart Apache: `sudo systemctl restart apache2`

### ✅ **Step 5a: Service Restart Requirements**
**Important: PHP files do NOT require service restarts**
- [ ] **PHP Code Changes**: No restart needed (BCAgentCore.php, index.php files)
  - PHP is interpreted at runtime
  - Changes take effect immediately on next request
- [ ] **Configuration Changes Requiring Restart**:
  - [ ] Apache configuration changes (httpd.conf, virtual hosts)
  - [ ] .htaccess changes (may require restart depending on server config)
  - [ ] PHP-FPM configuration changes (if using PHP-FPM)
  - [ ] SSL certificate updates
- [ ] **No Restart Required**:
  - [ ] .env file changes (loaded per request)
  - [ ] PHP application code changes (BCAgentCore.php, etc.)
  - [ ] Log file changes
  - [ ] Database credential updates in .env files

## Post-Deployment Testing

### ✅ **Step 6: Functional Testing**
- [ ] Test health endpoints:
  - [ ] `https://your-domain.com/bconsiteagentapp/health`
  - [ ] `https://your-domain.com/bcoracleagentapp/health`
- [ ] Test with sample headers:
  ```bash
  curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bconsiteagentapp
  curl -H "DOD_EDI_PN_ID: test123" https://your-domain.com/bcoracleagentapp
  ```
- [ ] Verify database connectivity and session creation
- [ ] Test redirect functionality
- [ ] Verify logging is working (check `logs/` directory)

### ✅ **Step 7: Security Verification**
- [ ] Confirm sensitive files are not accessible:
  - [ ] `https://your-domain.com/.env.prod` (should return 403/404)
  - [ ] `https://your-domain.com/settings/app.ini.php` (should return 403/404)
- [ ] Verify HTTPS redirect is working
- [ ] Test rate limiting functionality
- [ ] Confirm security headers are present
- [ ] Validate input sanitization

### ✅ **Step 8: Performance and Monitoring**
- [ ] Monitor application logs for errors
- [ ] Check Apache error logs
- [ ] Verify rate limiting is working as expected
- [ ] Test application under expected load
- [ ] Set up log rotation if needed

## Security Checklist

### ✅ **Production Security Verification**
- [ ] HTTPS is properly configured and enforced
- [ ] Database credentials are secure and not in version control
- [ ] Error display is disabled (`ENVIRONMENT=production`)
- [ ] Log files are not publicly accessible
- [ ] Configuration files are protected from direct access
- [ ] Rate limiting is properly configured
- [ ] Security headers are implemented
- [ ] File permissions are properly set (644 for files, 755 for directories)
- [ ] Sensitive directories are protected:
  - [ ] `/settings/` directory
  - [ ] `/shared/` directory
  - [ ] `/logs/` directory
  - [ ] `/tmp/` directory

## Files Excluded from Production

### ✅ **Verify These Are NOT in Production**
- [ ] `docs/` - Documentation files
- [ ] `tests/` - Test scripts and files
- [ ] `.env.dev` - Development environment file
- [ ] `.env.qa` - QA environment file
- [ ] `apache_php_config/` - Server configuration files
- [ ] Any log files from development/testing

## Rollback Plan

### ✅ **Prepare for Rollback (if needed)**
- [ ] Backup current production version before deployment
- [ ] Document rollback procedure
- [ ] Test rollback process in staging environment
- [ ] Keep previous version archive accessible

## Post-Deployment Monitoring

### ✅ **Ongoing Monitoring**
- [ ] Set up monitoring for:
  - [ ] Application health endpoints
  - [ ] Error logs
  - [ ] Database connectivity
  - [ ] Rate limiting violations
  - [ ] Performance metrics
- [ ] Schedule regular security updates
- [ ] Plan for log rotation and cleanup

## Sign-off

### ✅ **Deployment Approval**
- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Production testing completed
- [ ] Monitoring configured
- [ ] Documentation updated

**Deployment Date:** _______________  
**Deployed by:** _______________  
**Approved by:** _______________  

---

## Quick Reference Commands

### Health Check
```bash
curl https://your-domain.com/bconsiteagentapp/health
curl https://your-domain.com/bcoracleagentapp/health
```

### Log Monitoring
```bash
tail -f /var/www/html/cac/logs/bconsiteagent_$(date +%Y-%m-%d).log
tail -f /var/www/html/cac/logs/bcoracleagent_$(date +%Y-%m-%d).log
```

### Permission Reset
```bash
sudo chown -R www-data:www-data /var/www/html/cac
sudo find /var/www/html/cac -type d -exec chmod 755 {} \;
sudo find /var/www/html/cac -type f -exec chmod 644 {} \;
sudo chmod 600 /var/www/html/cac/.env.prod
