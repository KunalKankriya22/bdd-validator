<?php
/**
 * Development Environment Verification Script
 * 
 * This script verifies that your development environment is properly configured.
 * It checks environment settings, file permissions, PHP requirements,
 * database connection, and Okta configuration.
 * 
 * Usage: php deploy_dev.php
 */

// Start output buffering
ob_start();

// Define colors for terminal output
define('COLOR_RESET', "\033[0m");
define('COLOR_RED', "\033[31m");
define('COLOR_GREEN', "\033[32m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_MAGENTA', "\033[35m");
define('COLOR_CYAN', "\033[36m");
define('COLOR_WHITE', "\033[37m");

// Define symbols
define('SYMBOL_CHECK', "✓");
define('SYMBOL_CROSS', "✗");
define('SYMBOL_WARNING', "⚠");
define('SYMBOL_INFO', "ℹ");

// Initialize counters
$passCount = 0;
$failCount = 0;
$warningCount = 0;

// Initialize results array
$results = [];

// Display header
echo COLOR_CYAN . "\n";
echo "╔═════════════════════════════════════════════════════════════╗\n";
echo "║                                                             ║\n";
echo "║             DEVELOPMENT ENVIRONMENT VERIFICATION            ║\n";
echo "║                                                             ║\n";
echo "╚═════════════════════════════════════════════════════════════╝\n\n";
echo COLOR_RESET;

// Function to display section header
function displaySection($title) {
    echo COLOR_BLUE . "\n▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n";
    echo " $title\n";
    echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓\n" . COLOR_RESET;
}

// Function to display check result
function displayResult($check, $result, $message = '', $critical = true) {
    global $passCount, $failCount, $warningCount, $results;
    
    if ($result === true) {
        echo COLOR_GREEN . SYMBOL_CHECK . " PASS: " . COLOR_RESET . $check . "\n";
        $passCount++;
        $results[] = ['check' => $check, 'result' => 'PASS', 'message' => $message];
    } elseif ($result === 'WARNING') {
        echo COLOR_YELLOW . SYMBOL_WARNING . " WARNING: " . COLOR_RESET . $check . "\n";
        if ($message) {
            echo "       " . COLOR_YELLOW . $message . COLOR_RESET . "\n";
        }
        $warningCount++;
        $results[] = ['check' => $check, 'result' => 'WARNING', 'message' => $message];
    } else {
        echo COLOR_RED . SYMBOL_CROSS . " FAIL: " . COLOR_RESET . $check . "\n";
        if ($message) {
            echo "       " . COLOR_RED . $message . COLOR_RESET . "\n";
        }
        $failCount++;
        $results[] = ['check' => $check, 'result' => 'FAIL', 'message' => $message, 'critical' => $critical];
    }
}

// Function to check if running on CLI
function isRunningOnCLI() {
    return php_sapi_name() === 'cli';
}

// Function to check if a directory is writable
function isDirectoryWritable($dir) {
    if (!file_exists($dir)) {
        return false;
    }
    
    $testFile = $dir . '/write_test_' . time() . '.tmp';
    $handle = @fopen($testFile, 'w');
    
    if ($handle) {
        fclose($handle);
        unlink($testFile);
        return true;
    }
    
    return false;
}

// Function to check file permissions
function checkFilePermissions($file, $expectedPerms) {
    if (!file_exists($file)) {
        return [false, "File does not exist: $file"];
    }
    
    $currentPerms = substr(sprintf('%o', fileperms($file)), -3);
    
    if ($currentPerms != $expectedPerms) {
        return ['WARNING', "Current permissions: $currentPerms, Expected: $expectedPerms (not critical in dev)"];
    }
    
    return [true, ""];
}

// Function to test database connection
function testDatabaseConnection() {
    $dbConn = getenv('DB_CONN');
    $dbUser = getenv('DB_USER');
    $dbPassword = getenv('DB_PASSWORD');
    
    if (empty($dbConn) || empty($dbUser) || empty($dbPassword)) {
        return [false, "Database configuration is incomplete"];
    }
    
    try {
        $conn = @oci_connect($dbUser, $dbPassword, $dbConn);
        
        if (!$conn) {
            $e = oci_error();
            return [false, "Database connection failed: " . $e['message']];
        }
        
        // Test a simple query
        $stid = oci_parse($conn, 'SELECT 1 FROM DUAL');
        oci_execute($stid);
        
        $row = oci_fetch_array($stid, OCI_ASSOC+OCI_RETURN_NULLS);
        
        if ($row) {
            oci_free_statement($stid);
            oci_close($conn);
            return [true, ""];
        } else {
            oci_free_statement($stid);
            oci_close($conn);
            return [false, "Database query failed"];
        }
    } catch (Exception $e) {
        return [false, "Database connection error: " . $e->getMessage()];
    }
}

// Function to test Okta configuration
function testOktaConfiguration() {
    $metadataUrl = getenv('OKTA_METADATA_URL');
    
    if (empty($metadataUrl)) {
        return [false, "Okta metadata URL is not configured"];
    }
    
    // Check if cURL is available
    if (!function_exists('curl_init')) {
        return [false, "cURL extension is not available"];
    }
    
    // Initialize cURL session
    $ch = curl_init();
    
    // Set cURL options
    curl_setopt($ch, CURLOPT_URL, $metadataUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, getenv('OKTA_VERIFY_SSL') !== 'false');
    
    // Execute cURL session
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    // Close cURL session
    curl_close($ch);
    
    if ($error) {
        // In development, SSL errors are not critical
        if (strpos($error, 'SSL') !== false) {
            return ['WARNING', "Okta SSL verification issue: $error (not critical in dev)"];
        }
        return [false, "Okta connection error: $error"];
    }
    
    if ($httpCode != 200) {
        return [false, "Okta returned HTTP code $httpCode"];
    }
    
    // Try to decode the JSON response
    $metadata = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [false, "Invalid JSON response from Okta"];
    }
    
    // Check if the response contains expected fields
    if (!isset($metadata['issuer']) || !isset($metadata['authorization_endpoint'])) {
        return [false, "Incomplete metadata response from Okta"];
    }
    
    return [true, ""];
}

// Load environment variables
require_once __DIR__ . '/lib/env.php';

// Check if we're running in CLI mode
if (!isRunningOnCLI()) {
    echo "This script must be run from the command line.";
    exit(1);
}

// Load environment
displaySection("1. Environment Configuration");

// Try to load the development environment
$envLoaded = loadEnvironment('dev');
displayResult("Environment file loaded", $envLoaded, $envLoaded ? "" : "Could not load .env.dev file");

// Check environment settings
$appEnv = getenv('APP_ENV');
$isDevelopment = $appEnv === 'dev';
displayResult("APP_ENV set to development", $isDevelopment, $isDevelopment ? "" : "APP_ENV is set to '$appEnv' instead of 'dev'");

// Check debug mode - in development, debug should be enabled
$appDebug = getenv('APP_DEBUG');
$debugEnabled = $appDebug === 'true' || $appDebug === true || $appDebug === '1' || $appDebug === 1;
displayResult("APP_DEBUG is enabled", $debugEnabled, $debugEnabled ? "" : "APP_DEBUG should be set to 'true' for development", false);

// Check secure cookies - in development, this is optional
$secureCookies = getenv('SECURE_COOKIES');
$cookiesSecure = $secureCookies === 'true' || $secureCookies === true || $secureCookies === '1' || $secureCookies === 1;
if (!$cookiesSecure) {
    displayResult("SECURE_COOKIES setting", 'WARNING', "SECURE_COOKIES is disabled. This is acceptable for development but should be enabled in production.");
} else {
    displayResult("SECURE_COOKIES setting", true);
}

// Check base href
$baseHref = getenv('BASE_HREF');
$hasBaseHref = !empty($baseHref);
displayResult("BASE_HREF is set", $hasBaseHref, $hasBaseHref ? "" : "BASE_HREF must be set (e.g., '/okta/')");

// Local Server Configuration
displaySection("2. Local Server Configuration");

// Check if using localhost or development URLs
$onsiteRedirectUri = getenv('OKTA_ONSITE_REDIRECT_URI');
$oracleRedirectUri = getenv('OKTA_ORACLE_REDIRECT_URI');

$onsiteUsesLocalhost = strpos($onsiteRedirectUri, 'localhost') !== false || strpos($onsiteRedirectUri, '127.0.0.1') !== false;
$oracleUsesLocalhost = strpos($oracleRedirectUri, 'localhost') !== false || strpos($oracleRedirectUri, '127.0.0.1') !== false || strpos($oracleRedirectUri, 'bcapp') === 0;

displayResult("Onsite redirect URI uses localhost", $onsiteUsesLocalhost, $onsiteUsesLocalhost ? "" : "Onsite redirect URI should use localhost for development", false);
displayResult("Oracle redirect URI uses localhost or app scheme", $oracleUsesLocalhost, $oracleUsesLocalhost ? "" : "Oracle redirect URI should use localhost or app scheme for development", false);

// File Permissions
displaySection("3. File Permissions");

// Check .env file permissions - less strict for development
$envFile = __DIR__ . '/.env.dev';
if (file_exists($envFile)) {
    list($envPermsOk, $envPermsMsg) = checkFilePermissions($envFile, '644');
    displayResult(".env.dev file permissions", $envPermsOk, $envPermsMsg);
} else {
    displayResult(".env.dev file exists", false, "File not found");
}

// Check logs directory permissions
$logsDir = __DIR__ . '/logs';
if (is_dir($logsDir)) {
    list($logsDirPermsOk, $logsDirPermsMsg) = checkFilePermissions($logsDir, '755');
    displayResult("logs directory permissions", $logsDirPermsOk, $logsDirPermsMsg);
    
    // Check logs directory is writable
    $logsDirWritable = isDirectoryWritable($logsDir);
    displayResult("logs directory is writable", $logsDirWritable, $logsDirWritable ? "" : "Web server cannot write to logs directory");
    
    // Check app.log file permissions if it exists
    $appLogFile = $logsDir . '/app.log';
    if (file_exists($appLogFile)) {
        list($appLogPermsOk, $appLogPermsMsg) = checkFilePermissions($appLogFile, '644');
        displayResult("app.log file permissions", $appLogPermsOk, $appLogPermsMsg);
    } else {
        // Try to create the log file
        $logCreated = @file_put_contents($appLogFile, '') !== false;
        if ($logCreated) {
            chmod($appLogFile, 0644);
            displayResult("app.log file created", true);
            list($appLogPermsOk, $appLogPermsMsg) = checkFilePermissions($appLogFile, '644');
            displayResult("app.log file permissions", $appLogPermsOk, $appLogPermsMsg);
        } else {
            displayResult("app.log file exists", false, "File not found and could not be created");
        }
    }
} else {
    displayResult("logs directory exists", false, "Directory not found");
}

// PHP Requirements
displaySection("4. PHP Requirements");

// Include the requirements check script
$requirementsCheck = include_once __DIR__ . '/check_requirements.php';
displayResult("PHP requirements check passed", $requirementsCheck === true, $requirementsCheck === true ? "" : "Some PHP requirements are missing");

// Check PHP version
$requiredPhpVersion = '7.4.0';
$phpVersionOk = version_compare(PHP_VERSION, $requiredPhpVersion, '>=');
displayResult("PHP version " . $requiredPhpVersion . " or higher", $phpVersionOk, $phpVersionOk ? "" : "Current PHP version: " . PHP_VERSION);

// Database Connection
displaySection("5. Database Connection");

// Test database connection
list($dbConnected, $dbMessage) = testDatabaseConnection();
displayResult("Database connection successful", $dbConnected, $dbMessage);

// Okta Configuration
displaySection("6. Okta Configuration");

// Check Okta client IDs and secrets are set
$onsiteClientId = getenv('OKTA_ONSITE_CLIENT_ID');
$onsiteClientSecret = getenv('OKTA_ONSITE_CLIENT_SECRET');
$oracleClientId = getenv('OKTA_ORACLE_CLIENT_ID');
$oracleClientSecret = getenv('OKTA_ORACLE_CLIENT_SECRET');

$onsiteConfigured = !empty($onsiteClientId) && !empty($onsiteClientSecret);
$oracleConfigured = !empty($oracleClientId) && !empty($oracleClientSecret);

displayResult("Onsite Okta credentials configured", $onsiteConfigured, $onsiteConfigured ? "" : "Onsite client ID or secret is missing");
displayResult("Oracle Okta credentials configured", $oracleConfigured, $oracleConfigured ? "" : "Oracle client ID or secret is missing");

// Check SSL verification setting - in development, this can be disabled
$oktaVerifySsl = getenv('OKTA_VERIFY_SSL');
if ($oktaVerifySsl === 'false' || $oktaVerifySsl === false || $oktaVerifySsl === '0' || $oktaVerifySsl === 0) {
    displayResult("Okta SSL verification", 'WARNING', "SSL verification is disabled. This is acceptable for development but should be enabled in production.");
} else {
    displayResult("Okta SSL verification", true);
}

// Test Okta configuration
list($oktaConnected, $oktaMessage) = testOktaConfiguration();
displayResult("Okta connection test", $oktaConnected, $oktaMessage);

// Development Tools Check
displaySection("7. Development Tools");

// Check for Xdebug (useful for development)
$xdebugLoaded = extension_loaded('xdebug');
if (!$xdebugLoaded) {
    displayResult("Xdebug extension", 'WARNING', "Xdebug is not installed. It's recommended for development but not required.");
} else {
    displayResult("Xdebug extension", true);
}

// Display summary
displaySection("Development Environment Verification Summary");

echo COLOR_CYAN . "\nResults:\n";
echo "  " . COLOR_GREEN . "Passed: $passCount" . COLOR_RESET . "\n";
echo "  " . COLOR_YELLOW . "Warnings: $warningCount" . COLOR_RESET . "\n";
echo "  " . COLOR_RED . "Failed: $failCount" . COLOR_RESET . "\n\n";

if ($failCount > 0) {
    echo COLOR_RED . "Critical failures that must be fixed:\n" . COLOR_RESET;
    foreach ($results as $result) {
        if ($result['result'] === 'FAIL' && isset($result['critical']) && $result['critical']) {
            echo COLOR_RED . "  - " . $result['check'] . COLOR_RESET . "\n";
            if (!empty($result['message'])) {
                echo "    " . $result['message'] . "\n";
            }
        }
    }
    echo "\n";
}

if ($warningCount > 0) {
    echo COLOR_YELLOW . "Warnings (acceptable for development):\n" . COLOR_RESET;
    foreach ($results as $result) {
        if ($result['result'] === 'WARNING') {
            echo COLOR_YELLOW . "  - " . $result['check'] . COLOR_RESET . "\n";
            if (!empty($result['message'])) {
                echo "    " . $result['message'] . "\n";
            }
        }
    }
    echo "\n";
}

// Final status
if ($failCount > 0) {
    echo COLOR_RED . "❌ Development environment verification FAILED. Please fix the critical issues above before proceeding.\n\n" . COLOR_RESET;
    exit(1);
} else if ($warningCount > 0) {
    echo COLOR_YELLOW . "⚠️ Development environment verification PASSED WITH WARNINGS. These warnings are acceptable for development.\n\n" . COLOR_RESET;
    exit(0);
} else {
    echo COLOR_GREEN . "✅ Development environment verification PASSED. Your development environment is properly configured.\n\n" . COLOR_RESET;
    exit(0);
}
