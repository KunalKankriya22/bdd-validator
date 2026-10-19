# PHP Okta Authentication

A secure PHP application with Okta authentication integration, designed for production use.

## Features

- User authentication with Okta
- Protected routes for authenticated users
- User profile display
- Logout functionality
- Enhanced security features for production
- Proper error handling and logging
- Secure session management
- Security headers implementation

## Prerequisites

- PHP 7.4 or higher
- An Okta developer account
- Apache web server with mod_rewrite enabled (or equivalent)
- SSL certificate for production deployment

## Setup

### 1. Configure Okta

1. Sign up for a free Okta Developer account at [https://developer.okta.com/signup/](https://developer.okta.com/signup/)
2. Log in to your Okta account and navigate to the Admin Dashboard
3. Create a new application:
   - Click on "Applications" in the top menu
   - Click "Add Application"
   - Select "Web" and click "Next"
   - Enter a name for your application (e.g., "PHP Okta Auth")
   - For the Login redirect URIs, add: `http://localhost:8000/callback` (for development) and your production URL
   - For the Logout redirect URIs, add: `http://localhost:8000` (for development) and your production URL
   - Click "Done"
4. Note your Client ID and Client Secret

### 2. Configure environment variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the Okta configuration with your values:
   ```
   OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default
   OKTA_CLIENT_ID={yourClientId}
   OKTA_CLIENT_SECRET={yourClientSecret}
   OKTA_REDIRECT_URI=http://localhost:8000/callback
   ```

3. For production deployment, update the following settings:
   ```
   APP_ENV=production
   APP_DEBUG=false
   SECURE_COOKIES=true
   ```

### 3. Development Server

For development, you can use PHP's built-in server:

#### Windows
```bash
run-local.bat
```

#### macOS/Linux
```bash
chmod +x run-local.sh
./run-local.sh
```

Or manually:
```bash
cd public
php -S localhost:8000
```

### 4. Production Deployment

For production deployment, follow these steps:

1. Upload all files to your production server
2. Make sure the `.env` file has production settings:
   ```
   APP_ENV=production
   APP_DEBUG=false
   SECURE_COOKIES=true
   ```
3. Ensure your web server is configured to use HTTPS
4. Run the deployment script to verify your setup:
   ```bash
   php deploy.php
   ```
5. Set proper file permissions:
   ```bash
   chmod 600 .env
   chmod 755 logs
   chmod 644 logs/app.log
   ```

## Usage

1. Open your browser and navigate to your application URL
2. Click on the "Login" button to authenticate with Okta
3. After successful authentication, you'll be redirected to the home page
4. You can view your profile information by clicking on the "Profile" link
5. To log out, click on the "Logout" link

## Directory Structure

- `/config` - Configuration files
- `/public` - Public-facing files and application entry point
- `/src` - Application source code
  - `/Auth` - Authentication-related classes
  - `/Middleware` - Middleware classes
  - `/Utils` - Utility classes for security, error handling, etc.
  - `/Views` - View templates
- `/logs` - Application logs (created automatically)

## Implementation Notes

This application is designed to work without external dependencies for simplicity and ease of deployment:

- **No Composer Dependencies**: While a `composer.json` file is included as a reference, the application does not require running `composer install`. All necessary functionality is implemented with custom classes.

- **Custom Implementations**:
  - `EnvLoader` - Custom environment variable loading instead of using phpdotenv
  - `OktaAuthService` - Enhanced JWT validation without external JWT libraries
  - `ErrorHandler` - Custom error handling and logging
  - `SessionManager` - Secure session management
  - `SecurityHeaders` - Implementation of security headers

- **Manual Class Loading**: The application uses `require_once` statements instead of an autoloader for simplicity.

This approach makes the application easier to deploy and understand, with a smaller footprint and no dependency conflicts.

## Security Features

This application includes several security enhancements:

1. **Enhanced JWT Validation**: More thorough validation of ID tokens
2. **SSL Verification**: Proper SSL verification in production
3. **Secure Session Management**: HTTP-only, secure cookies with proper session handling
4. **Security Headers**: Implementation of security headers like CSP, X-Frame-Options, etc.
5. **Error Handling**: Proper error handling and logging
6. **HTTPS Enforcement**: Automatic redirection to HTTPS in production
7. **File Protection**: Protection of sensitive files like .env
8. **Production Deployment Script**: A script to verify production readiness

## Production Checklist

Before deploying to production, ensure:

- [ ] Okta configuration is properly set up with production URLs
- [ ] APP_ENV is set to 'production' in .env
- [ ] APP_DEBUG is set to 'false' in .env
- [ ] SECURE_COOKIES is set to 'true' in .env
- [ ] SSL certificate is installed and configured
- [ ] File permissions are properly set
- [ ] Logs directory is writable
- [ ] Run the deployment script to verify your setup

## License

This project is licensed under the MIT License - see the LICENSE file for details.
