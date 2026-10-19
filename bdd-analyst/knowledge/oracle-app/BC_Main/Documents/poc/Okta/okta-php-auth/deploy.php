<?php
/**
 * Production Deployment Script
 * 
 * This script helps with deploying the application to a production environment.
 * It performs various tasks such as setting file permissions, optimizing the application,
 * and clearing caches.
 */

// Start time
$startTime = microtime(true);
echo "Starting deployment process...\n";

// Custom function to parse .env file with comments
function parseEnvFile($filePath) {
    $result = [];
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse the line
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove comments at the end of the line
            if (strpos($value, '#') !== false) {
                $value = trim(explode('#', $value)[0]);
            }
            
            // Remove quotes if present
            if (
                (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)
            ) {
                $value = substr($value, 1, -1);
            }
            
            $result[$name] = $value;
        }
    }
    
    return $result;
}

// Load environment variables
$env = parseEnvFile('.env');

// Check if running in production mode
if ($env['APP_ENV'] !== 'production') {
    echo "Warning: Not running in production mode. Set APP_ENV=production in .env file.\n";
}

// Create logs directory and log file if they don't exist
if (!is_dir('logs')) {
    echo "Creating logs directory...\n";
    mkdir('logs', 0755, true);
}

if (!file_exists('logs/app.log')) {
    echo "Creating app.log file...\n";
    touch('logs/app.log');
}

// Set proper permissions
echo "Setting file permissions...\n";
chmod('.env', 0600);
chmod('logs', 0755);
chmod('logs/app.log', 0644);

// Verify Okta configuration
echo "Verifying Okta configuration...\n";
$requiredEnvVars = [
    'OKTA_ISSUER',
    'OKTA_CLIENT_ID',
    'OKTA_CLIENT_SECRET',
    'OKTA_REDIRECT_URI',
    'APP_URL',
    'APP_ENV'
];

$missingVars = [];
foreach ($requiredEnvVars as $var) {
    if (empty($env[$var]) || $env[$var] === '{your' . ucfirst(strtolower(str_replace('OKTA_', '', $var))) . '}') {
        $missingVars[] = $var;
    }
}

if (!empty($missingVars)) {
    echo "Error: The following environment variables are missing or have default values:\n";
    foreach ($missingVars as $var) {
        echo "- $var\n";
    }
    echo "Please update the .env file with the correct values.\n";
    exit(1);
}

// Check for production settings
if ($env['APP_ENV'] !== 'production') {
    echo "Warning: APP_ENV is not set to 'production'.\n";
}

if ($env['APP_DEBUG'] !== 'false') {
    echo "Warning: APP_DEBUG should be set to 'false' in production.\n";
}

if ($env['SECURE_COOKIES'] !== 'true') {
    echo "Warning: SECURE_COOKIES should be set to 'true' in production.\n";
}

// Check PHP version
echo "Checking PHP version...\n";
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    echo "Error: PHP version 7.4 or higher is required. Current version: " . PHP_VERSION . "\n";
    exit(1);
}

// Check PHP extensions
echo "Checking PHP extensions...\n";
$requiredExtensions = ['openssl', 'mbstring', 'json', 'curl'];
$missingExtensions = [];
foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

if (!empty($missingExtensions)) {
    echo "Error: The following PHP extensions are missing:\n";
    foreach ($missingExtensions as $ext) {
        echo "- $ext\n";
    }
    echo "Please install these extensions before deploying.\n";
    exit(1);
}

// Check if mod_rewrite is enabled (if using Apache)
echo "Checking Apache mod_rewrite...\n";
if (function_exists('apache_get_modules') && !in_array('mod_rewrite', apache_get_modules())) {
    echo "Warning: Apache mod_rewrite is not enabled. This is required for the application to work properly.\n";
}

// Verify file structure
echo "Verifying file structure...\n";
$requiredFiles = [
    'public/index.php',
    'src/Auth/OktaAuthService.php',
    'src/Middleware/AuthMiddleware.php',
    'config/config.php',
    '.env',
    '.htaccess'
];

$missingFiles = [];
foreach ($requiredFiles as $file) {
    if (!file_exists($file)) {
        $missingFiles[] = $file;
    }
}

if (!empty($missingFiles)) {
    echo "Error: The following required files are missing:\n";
    foreach ($missingFiles as $file) {
        echo "- $file\n";
    }
    echo "Please ensure all required files are present before deploying.\n";
    exit(1);
}

// Create a production-ready .htaccess file if it doesn't exist
if (!file_exists('.htaccess')) {
    echo "Creating production .htaccess file...\n";
    $htaccess = <<<EOT
# Redirect to HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Prevent directory listing
Options -Indexes

# Protect .env file
<Files ~ "^\.env">
    Order allow,deny
    Deny from all
</Files>

# Protect .htaccess file
<Files ~ "^\.htaccess">
    Order allow,deny
    Deny from all
</Files>

# Protect composer files
<Files ~ "^composer\.(json|lock)$">
    Order allow,deny
    Deny from all
</Files>

# Protect logs directory
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect against common vulnerabilities
<IfModule mod_headers.c>
    # Protect against clickjacking
    Header always set X-Frame-Options "SAMEORIGIN"
    
    # Protect against XSS attacks
    Header always set X-XSS-Protection "1; mode=block"
    
    # Disable MIME-type sniffing
    Header always set X-Content-Type-Options "nosniff"
    
    # Referrer policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Content Security Policy (CSP)
    # Adjust this policy based on your application's needs
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';"
</IfModule>

# Redirect all requests to public/index.php
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^$ public/ [L]
    RewriteRule (.*) public/$1 [L]
</IfModule>
EOT;
    file_put_contents('.htaccess', $htaccess);
}

// Deployment complete
$endTime = microtime(true);
$executionTime = round($endTime - $startTime, 2);
echo "Deployment completed in $executionTime seconds.\n";
echo "The application is now ready for production use.\n";

// Deployment checklist
echo "\nProduction Deployment Checklist:\n";
echo "✓ Verify Okta configuration in .env file\n";
echo "✓ Set APP_ENV=production in .env file\n";
echo "✓ Set APP_DEBUG=false in .env file\n";
echo "✓ Set SECURE_COOKIES=true in .env file\n";
echo "✓ Ensure proper file permissions\n";
echo "✓ Configure web server for HTTPS\n";
echo "✓ Set up proper error logging\n";
echo "✓ Implement proper session handling\n";
echo "✓ Enable security headers\n";
echo "✓ Protect sensitive files\n";

echo "\nAdditional Recommendations:\n";
echo "- Set up a proper monitoring solution\n";
echo "- Implement automated backups\n";
echo "- Configure rate limiting to prevent abuse\n";
echo "- Set up a Content Delivery Network (CDN) for better performance\n";
echo "- Implement a Web Application Firewall (WAF) for additional security\n";
