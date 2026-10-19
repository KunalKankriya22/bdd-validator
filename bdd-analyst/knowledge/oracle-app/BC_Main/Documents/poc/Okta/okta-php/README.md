# Okta PHP Authentication Application

This application provides OAuth 2.0 authentication with Okta for two different clients: BCOnsite and BCOracle.

## Features

- OAuth 2.0 authentication with Okta
- PKCE (Proof Key for Code Exchange) for enhanced security
- Session management with security features
- Environment-specific configurations (dev, qa, prod)
- Database integration for storing user information

## Directory Structure

- `/bconsiteapp` - BCOnsite application
- `/bcoracleapp` - BCOracle application
- `/lib` - Shared libraries
  - `auth.php` - OAuth 2.0 authentication with Okta
  - `common.php` - Shared utility functions
  - `config.php` - Configuration management
  - `database.php` - Database operations
  - `session.php` - Session management
- `/settings` - Configuration files for different environments
- `/logs` - Application logs

## Configuration System

This application uses a clear separation of concerns for configuration:

1. **Environment Variables (.env files)** - For sensitive data and environment-specific settings
   - Database credentials
   - API keys and secrets
   - Redirect URLs
   - Environment-specific settings

2. **PHP Configuration File** - For structured configuration that doesn't change between environments
   - Application routes
   - Feature flags
   - Static configuration

### Environment Files

The application looks for environment-specific .env files in the following order:
1. `.env.{environment}` (e.g., `.env.dev`, `.env.qa`, `.env.prod`)
2. `.env` (fallback)

To set up your environment:
1. Copy `.env.example` to `.env.{environment}` (e.g., `.env.dev`)
2. Update the values in the new file with your environment-specific settings
3. Make sure the file is not accessible from the web (protected by .htaccess)

### PHP Configuration File

The application uses a single PHP configuration file for structured configuration:
- `app.ini.php` - Contains common settings and structured configuration that doesn't change between environments

The application still detects the current environment (dev, qa, prod) based on:

1. The `APP_ENV` environment variable from .env file
2. The server hostname (e.g., if it contains 'dev', 'qa', or 'localhost')
3. Defaults to 'dev' if neither of the above is available

This environment detection is used for logging and to determine which .env file to load.

## Session Management

The application uses a dedicated SessionManager class for secure session handling:

- Automatic session validation and regeneration
- Protection against session fixation attacks
- Configurable session timeouts
- Environment-specific session settings
- User authentication state management

## Environment Variables

The following environment variables can be set in your .env file:

- `APP_ENV` - Application environment (dev, qa, prod)
- `BASE_HREF` - Base URL path for the application (e.g., '/okta/')
- `DB_CONN` - Database connection string
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `OKTA_METADATA_URL` - Okta OAuth 2.0 metadata URL
- `OKTA_ONSITE_CLIENT_ID` - Okta client ID for BCOnsite
- `OKTA_ONSITE_CLIENT_SECRET` - Okta client secret for BCOnsite
- `OKTA_ORACLE_CLIENT_ID` - Okta client ID for BCOracle
- `OKTA_ORACLE_CLIENT_SECRET` - Okta client secret for BCOracle
- `OKTA_ONSITE_REDIRECT_URI` - Redirect URI for BCOnsite
- `OKTA_ORACLE_REDIRECT_URI` - Redirect URI for BCOracle
- `OKTA_ONSITE_REDIRECT_URL` - Redirect URL for BCOnsite
- `OKTA_ORACLE_REDIRECT_URL` - Redirect URL for BCOracle
- `OKTA_VERIFY_SSL` - Whether to verify SSL certificates
- `OKTA_SESSION_TIMEOUT` - Session timeout in seconds
- `OKTA_SESSION_MAX_LIFETIME` - Maximum session lifetime in seconds

## Usage

1. Configure the application by editing the `app.ini.php` file in the `/settings` directory
2. Access the application at `/bconsiteapp` or `/bcoracleapp`
3. The application will automatically redirect to Okta for authentication
4. After successful authentication, the user will be redirected to the appropriate application

## Development

To run the application in development mode:

1. Set up a local web server (e.g., Apache, Nginx) with PHP support
2. Configure the web server to point to the application directory
3. Copy `.env.example` to `.env.dev` and update the values
4. Access the application at `http://localhost/bconsiteapp` or `http://localhost/bcoracleapp`

## Examples

The `/examples` directory contains example scripts that demonstrate how to use the SessionManager and OktaAuth classes in your own code:

- `session_example.php` - Demonstrates how to use the SessionManager class and environment-specific configurations
- `auth_example.php` - Demonstrates how to use the OktaAuth class with SessionManager for a custom application

To run the examples:

1. Configure the application as described above
2. Access the examples at `http://localhost/examples/session_example.php` or `http://localhost/examples/auth_example.php`

## Security Considerations

- In production, always set `OKTA_VERIFY_SSL=true` in the .env file
- Use strong, unique client secrets for each environment
- Regularly rotate client secrets
- Keep .env files outside the web root if possible
- Ensure .env files are protected by .htaccess rules
- Monitor the application logs for security events
- Consider implementing additional security measures such as IP restrictions and rate limiting
