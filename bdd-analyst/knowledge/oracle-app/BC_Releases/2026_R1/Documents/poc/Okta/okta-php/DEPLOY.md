# Deployment Instructions

## Prerequisites
- PHP 7.4 or higher
- Apache web server with mod_rewrite enabled

## Installation

1. Clone or download the repository to your web server

2. Set up environment configuration:
   ```
   cp .env.example .env.{environment}
   ```
   Replace `{environment}` with `dev`, `qa`, or `prod` as appropriate.

3. Edit the `.env.{environment}` file with your environment-specific settings:
   - Database connection details
   - Okta client credentials
   - Redirect URIs and URLs
   - SSL verification settings
   - Session timeout settings

4. Ensure the web server has write access to the `logs` directory:
   ```
   chmod 755 logs
   ```

5. Configure your web server:
   - Set the document root to the application root directory
   - Ensure .htaccess files are enabled (AllowOverride All)
   - Deny access to `.env*` files (already configured in .htaccess)
   - Deny access to the `settings` directory (already configured in .htaccess)

## Environment-Specific Deployment

### Development Environment

1. Copy the example environment file:
   ```
   cp .env.example .env.dev
   ```

2. Edit `.env.dev` with development-specific settings:
   - Set `APP_ENV=dev`
   - Configure development database credentials
   - Set Okta development client credentials
   - Set `OKTA_VERIFY_SSL=false` (for development only)
   - Set longer session timeouts for testing if needed

3. Access the application at:
   - http://localhost/bconsiteapp
   - http://localhost/bcoracleapp

### QA Environment

1. Copy the example environment file:
   ```
   cp .env.example .env.qa
   ```

2. Edit `.env.qa` with QA-specific settings:
   - Set `APP_ENV=qa`
   - Configure QA database credentials
   - Set Okta QA client credentials
   - Set `OKTA_VERIFY_SSL=true` (recommended)

### Production Environment

1. Copy the example environment file:
   ```
   cp .env.example .env.prod
   ```

2. Edit `.env.prod` with production-specific settings:
   - Set `APP_ENV=prod`
   - Configure production database credentials
   - Set Okta production client credentials
   - Set `OKTA_VERIFY_SSL=true` (required for production)
   - Set appropriate session timeout values

3. Additional production security measures:
   - Consider moving `.env.prod` outside the web root
   - Ensure all sensitive files are protected
   - Set up proper SSL certificates
   - Configure appropriate logging

## Troubleshooting

### Common Issues

1. **Environment not detected correctly**
   - Check that the `APP_ENV` variable is set correctly in your .env file
   - Verify that the .env file is readable by the web server

2. **Configuration not loading**
   - Check file permissions on .env files
   - Verify that the .env file exists in the correct location
   - Check the application logs for any error messages

3. **Authentication failures**
   - Verify Okta client credentials
   - Check redirect URIs in Okta configuration
   - Ensure SSL settings are correct

### Logging

- Application logs are stored in the `logs/app.log` file
- Check these logs for any errors or warnings
- In production, consider setting up log rotation
