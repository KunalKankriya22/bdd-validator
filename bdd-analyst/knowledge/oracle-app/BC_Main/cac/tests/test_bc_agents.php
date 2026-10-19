<?php
/**
 * Comprehensive Test Suite for BC_Agents Application
 * 
 * This script tests all functionality of the BC_Agents application including:
 * - File structure and deployment readiness
 * - Environment configuration loading
 * - Core functionality (logging, validation, rate limiting)
 * - Application configuration and settings
 * - Security features
 * 
 * @author Blood Center Development Team
 * @version 2.0.0
 */

// Simulate web server environment for testing
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/bconsiteagentapp/';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_USER_AGENT'] = 'BC_Agents Test Suite 2.0';
$_SERVER['HTTPS'] = 'on';

// Mock Apache headers function if not available
if (!function_exists('apache_request_headers')) {
    function apache_request_headers() {
        return [
            'DOD_EDI_PN_ID' => 'TEST_EDI_123',
            'UNIQUE_ID' => 'TEST_UNIQUE_456',
            'Content-Type' => 'text/html'
        ];
    }
}

echo "=== BC_Agents Comprehensive Test Suite ===\n";
echo "Version: 2.0.0\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "==========================================\n\n";

$testResults = [];
$totalTests = 0;
$passedTests = 0;

function runTest($testName, $testFunction) {
    global $testResults, $totalTests, $passedTests;
    
    echo "Test: $testName\n";
    echo str_repeat('-', strlen($testName) + 6) . "\n";
    
    $totalTests++;
    try {
        $result = $testFunction();
        if ($result) {
            $testResults[$testName] = 'PASS';
            $passedTests++;
            echo "✓ PASSED\n\n";
        } else {
            $testResults[$testName] = 'FAIL';
            echo "✗ FAILED\n\n";
        }
    } catch (Exception $e) {
        $testResults[$testName] = 'ERROR';
        echo "✗ ERROR: " . $e->getMessage() . "\n\n";
    }
}

// Test 1: File Structure and Deployment Readiness
runTest("File Structure and Deployment Readiness", function() {
    $requiredFiles = [
        '.env.prod' => 'Production environment configuration',
        '.env.dev' => 'Development environment configuration',
        '.env.qa' => 'QA environment configuration',
        '.htaccess' => 'Apache configuration and URL rewriting',
        'settings/app.ini.php' => 'Application settings',
        'shared/BCAgentCore.php' => 'Shared core functionality',
        'bconsiteagentapp/index.php' => 'BC Onsite Agent application',
        'bcoracleagentapp/index.php' => 'BC Oracle Agent application'
    ];

    $requiredDirs = [
        'logs' => 'Application logs directory',
        'tmp' => 'Temporary files directory',
        'settings' => 'Settings directory',
        'shared' => 'Shared code directory',
        'bconsiteagentapp' => 'BC Onsite Agent application directory',
        'bcoracleagentapp' => 'BC Oracle Agent application directory'
    ];

    $allExists = true;
    
    echo "Checking required files:\n";
    foreach ($requiredFiles as $file => $description) {
        if (file_exists($file)) {
            echo "  ✓ $file - $description\n";
        } else {
            echo "  ✗ $file - MISSING - $description\n";
            $allExists = false;
        }
    }
    
    echo "\nChecking required directories:\n";
    foreach ($requiredDirs as $dir => $description) {
        if (is_dir($dir)) {
            echo "  ✓ $dir/ - $description\n";
        } else {
            echo "  ✗ $dir/ - MISSING - $description\n";
            $allExists = false;
        }
    }
    
    return $allExists;
});

// Test 2: Environment Configuration Loading
runTest("Environment Configuration Loading", function() {
    require_once 'shared/BCAgentCore.php';
    
    // Test QA environment loading
    $_ENV['APP_ENV'] = 'qa';
    $envConfig = EnvLoader::load();
    
    $requiredKeys = ['DB_CONN', 'DB_USER', 'DB_PASSWORD', 'LOG_LEVEL', 'ENVIRONMENT'];
    $allKeysPresent = true;
    
    echo "Environment: QA\n";
    echo "Checking required configuration keys:\n";
    foreach ($requiredKeys as $key) {
        if (isset($envConfig[$key]) && !empty($envConfig[$key])) {
            echo "  ✓ $key: " . $envConfig[$key] . "\n";
        } else {
            echo "  ✗ $key: MISSING or EMPTY\n";
            $allKeysPresent = false;
        }
    }
    
    // Test application-specific URLs
    echo "\nApplication redirect URLs:\n";
    $bconsiteUrl = $envConfig['BCONSITEAGENT_REDIRECT_URL'] ?? '';
    $bcoracleUrl = $envConfig['BCORACLEAGENT_REDIRECT_URL'] ?? '';
    
    if (!empty($bconsiteUrl)) {
        echo "  ✓ BC Onsite Agent URL: $bconsiteUrl\n";
    } else {
        echo "  ✗ BC Onsite Agent URL: MISSING\n";
        $allKeysPresent = false;
    }
    
    if (!empty($bcoracleUrl)) {
        echo "  ✓ BC Oracle Agent URL: $bcoracleUrl\n";
    } else {
        echo "  ✗ BC Oracle Agent URL: MISSING\n";
        $allKeysPresent = false;
    }
    
    return $allKeysPresent;
});

// Test 3: Application Configuration and Settings
runTest("Application Configuration and Settings", function() {
    // Test app.ini.php loading
    $appConfig = Config::loadAppConfig();
    
    echo "Application settings:\n";
    echo "  App Name: " . ($appConfig['application']['app_name'] ?? 'MISSING') . "\n";
    echo "  App Version: " . ($appConfig['application']['app_version'] ?? 'MISSING') . "\n";
    echo "  Log Level: " . ($appConfig['application']['log_level'] ?? 'MISSING') . "\n";
    
    // Test configuration loading with different applications
    echo "\nTesting application auto-detection:\n";
    
    // We need to test the URL detection logic directly since Config caches results
    // Test bconsiteagent detection
    $_SERVER['SCRIPT_NAME'] = '/bconsiteagentapp/index.php';
    $reflection = new ReflectionClass('Config');
    $method = $reflection->getMethod('detectApplicationName');
    $method->setAccessible(true);
    $detectedApp1 = $method->invoke(null);
    echo "  ✓ BC Onsite Agent detected: $detectedApp1\n";
    
    // Test bcoracleagent detection
    $_SERVER['SCRIPT_NAME'] = '/bcoracleagentapp/index.php';
    $detectedApp2 = $method->invoke(null);
    echo "  ✓ BC Oracle Agent detected: $detectedApp2\n";
    
    // Test URL retrieval logic
    $envConfig = EnvLoader::load();
    $urlMethod = $reflection->getMethod('getAppRedirectUrl');
    $urlMethod->setAccessible(true);
    
    $url1 = $urlMethod->invoke(null, 'bconsiteagent', $envConfig);
    $url2 = $urlMethod->invoke(null, 'bcoracleagent', $envConfig);
    
    echo "    BC Onsite Agent URL: $url1\n";
    echo "    BC Oracle Agent URL: $url2\n";
    
    // Verify different URLs for different apps
    $differentUrls = $url1 !== $url2;
    echo "  " . ($differentUrls ? "✓" : "✗") . " Applications have different redirect URLs\n";
    
    return isset($appConfig['application']['app_name']) && $differentUrls && ($detectedApp1 === 'bconsiteagent') && ($detectedApp2 === 'bcoracleagent');
});

// Test 4: Logging Functionality
runTest("Logging Functionality", function() {
    Logger::init('test', 'DEBUG');
    
    // Test different log levels
    Logger::debug('Debug message for testing');
    Logger::info('Info message for testing');
    Logger::warning('Warning message for testing');
    Logger::error('Error message for testing');
    Logger::critical('Critical message for testing');
    
    $logFile = 'logs/test_' . date('Y-m-d') . '.log';
    
    if (!file_exists($logFile)) {
        echo "Log file not created\n";
        return false;
    }
    
    $logContent = file_get_contents($logFile);
    $debugCount = substr_count($logContent, '[DEBUG]');
    $infoCount = substr_count($logContent, '[INFO]');
    $warningCount = substr_count($logContent, '[WARNING]');
    $errorCount = substr_count($logContent, '[ERROR]');
    $criticalCount = substr_count($logContent, '[CRITICAL]');
    
    echo "Log file created: " . basename($logFile) . "\n";
    echo "Log entries written:\n";
    echo "  DEBUG: $debugCount\n";
    echo "  INFO: $infoCount\n";
    echo "  WARNING: $warningCount\n";
    echo "  ERROR: $errorCount\n";
    echo "  CRITICAL: $criticalCount\n";
    
    return $infoCount > 0 && $errorCount > 0;
});

// Test 5: Input Validation and Security
runTest("Input Validation and Security", function() {
    $allPassed = true;
    
    echo "Testing header validation:\n";
    
    // Test valid headers
    $validTests = [
        'TEST123' => 'Simple alphanumeric',
        'user@domain.com' => 'Email format',
        'user-name_123' => 'With hyphens and underscores'
    ];
    
    foreach ($validTests as $input => $description) {
        $result = Validator::validateHeader($input);
        if ($result === $input) {
            echo "  ✓ Valid: '$input' ($description)\n";
        } else {
            echo "  ✗ Valid: '$input' ($description) - Rejected\n";
            $allPassed = false;
        }
    }
    
    echo "\nTesting invalid header rejection:\n";
    
    // Test invalid headers
    $invalidTests = [
        'test<script>' => 'XSS attempt',
        "test\x00null" => 'Null byte injection',
        str_repeat('A', 300) => 'Too long (300 chars)',
        'test;DROP TABLE' => 'SQL injection attempt'
    ];
    
    foreach ($invalidTests as $input => $description) {
        $result = Validator::validateHeader($input);
        if ($result === false) {
            echo "  ✓ Invalid: '$description' - Properly rejected\n";
        } else {
            echo "  ✗ Invalid: '$description' - Incorrectly accepted\n";
            $allPassed = false;
        }
    }
    
    echo "\nTesting URL validation:\n";
    
    // Test valid URLs
    $validUrls = [
        'https://example.com/path' => 'HTTPS URL',
        'http://localhost/test' => 'HTTP URL',
        'bcvbs://launch' => 'Custom protocol',
        'bcapp2026r1-prddb://session123' => 'Custom production protocol'
    ];
    
    foreach ($validUrls as $url => $description) {
        $result = Validator::validateUrl($url);
        if ($result) {
            echo "  ✓ Valid URL: '$description'\n";
        } else {
            echo "  ✗ Valid URL: '$description' - Rejected\n";
            $allPassed = false;
        }
    }
    
    // Test invalid URLs
    $invalidUrls = [
        'javascript:alert(1)' => 'JavaScript injection',
        'not-a-url' => 'Invalid format',
        'http://' => 'Incomplete URL'
    ];
    
    foreach ($invalidUrls as $url => $description) {
        $result = Validator::validateUrl($url);
        if (!$result) {
            echo "  ✓ Invalid URL: '$description' - Properly rejected\n";
        } else {
            echo "  ✗ Invalid URL: '$description' - Incorrectly accepted\n";
            $allPassed = false;
        }
    }
    
    return $allPassed;
});

// Test 6: Rate Limiting
runTest("Rate Limiting", function() {
    $testIp = '192.168.1.100';
    $limit = 3;
    $window = 60; // 1 minute
    
    echo "Testing rate limiting (limit: $limit requests per $window seconds):\n";
    
    $results = [];
    for ($i = 1; $i <= 5; $i++) {
        $allowed = RateLimiter::checkLimit($testIp, $limit, $window);
        $results[] = $allowed;
        $status = $allowed ? 'ALLOWED' : 'BLOCKED';
        echo "  Request $i: $status\n";
    }
    
    // First 3 should be allowed, last 2 should be blocked
    $expectedPattern = [true, true, true, false, false];
    $patternMatches = $results === $expectedPattern;
    
    echo "Rate limiting working correctly: " . ($patternMatches ? "YES" : "NO") . "\n";
    
    // Test rate limit file creation
    $rateLimitFiles = glob('tmp/rate_limit_*.json');
    echo "Rate limit tracking files created: " . count($rateLimitFiles) . "\n";
    
    return $patternMatches && count($rateLimitFiles) > 0;
});

// Test 7: Session ID Generation
runTest("Session ID Generation", function() {
    echo "Testing secure session ID generation:\n";
    
    $sessionIds = [];
    for ($i = 1; $i <= 5; $i++) {
        $sessionId = bin2hex(random_bytes(16)) . '_' . time();
        $sessionIds[] = $sessionId;
        echo "  Session ID $i: $sessionId\n";
    }
    
    // Check uniqueness
    $uniqueIds = array_unique($sessionIds);
    $allUnique = count($sessionIds) === count($uniqueIds);
    
    // Check format (32 hex chars + underscore + timestamp)
    $validFormat = true;
    foreach ($sessionIds as $id) {
        if (!preg_match('/^[a-f0-9]{32}_\d+$/', $id)) {
            $validFormat = false;
            break;
        }
    }
    
    echo "All session IDs unique: " . ($allUnique ? "YES" : "NO") . "\n";
    echo "Valid format: " . ($validFormat ? "YES" : "NO") . "\n";
    
    return $allUnique && $validFormat;
});

// Test 8: Database Connection Class
runTest("Database Connection Class", function() {
    echo "Testing database connection class structure:\n";
    
    // Test that Database class exists and has required methods
    $hasConnectMethod = method_exists('Database', 'connect');
    $hasDisconnectMethod = method_exists('Database', 'disconnect');
    
    echo "  Database::connect() method: " . ($hasConnectMethod ? "EXISTS" : "MISSING") . "\n";
    echo "  Database::disconnect() method: " . ($hasDisconnectMethod ? "EXISTS" : "MISSING") . "\n";
    echo "  Note: Actual database connection requires valid Oracle credentials\n";
    echo "  Note: OCI8 extension required for Oracle connectivity\n";
    
    // Check if OCI8 extension is loaded
    $oci8Loaded = extension_loaded('oci8');
    echo "  OCI8 extension loaded: " . ($oci8Loaded ? "YES" : "NO") . "\n";
    
    return $hasConnectMethod && $hasDisconnectMethod;
});

// Test 9: Apache Configuration
runTest("Apache Configuration", function() {
    echo "Testing .htaccess configuration:\n";
    
    $htaccessFile = '.htaccess';
    if (!file_exists($htaccessFile)) {
        echo ".htaccess file not found\n";
        return false;
    }
    
    $htaccessContent = file_get_contents($htaccessFile);
    
    // Check for required directives
    $requiredDirectives = [
        'RewriteEngine On' => 'URL rewriting enabled',
        'SetEnv APP_ENV' => 'Environment variable set',
        'bconsiteagentapp' => 'BC Onsite Agent routing',
        'bcoracleagentapp' => 'BC Oracle Agent routing',
        'FilesMatch' => 'Sensitive file protection'
    ];
    
    $allDirectivesPresent = true;
    foreach ($requiredDirectives as $directive => $description) {
        if (strpos($htaccessContent, $directive) !== false) {
            echo "  ✓ $description\n";
        } else {
            echo "  ✗ $description - MISSING\n";
            $allDirectivesPresent = false;
        }
    }
    
    return $allDirectivesPresent;
});

// Cleanup test files
echo "Cleanup\n";
echo "-------\n";
try {
    // Clean up rate limit test files
    $tmpFiles = glob('tmp/rate_limit_*.json');
    $cleanedFiles = 0;
    foreach ($tmpFiles as $file) {
        if (strpos(basename($file), date('Y-m-d')) !== false) {
            unlink($file);
            $cleanedFiles++;
        }
    }
    echo "✓ Cleaned up $cleanedFiles rate limit test files\n";
    echo "✓ Test log files remain in logs directory for review\n\n";
    
} catch (Exception $e) {
    echo "✗ Cleanup failed: " . $e->getMessage() . "\n\n";
}

// Test Summary
echo "=== TEST SUMMARY ===\n";
echo "Total Tests: $totalTests\n";
echo "Passed: $passedTests\n";
echo "Failed: " . ($totalTests - $passedTests) . "\n";
echo "Success Rate: " . round(($passedTests / $totalTests) * 100, 1) . "%\n\n";

echo "Detailed Results:\n";
foreach ($testResults as $testName => $result) {
    $status = $result === 'PASS' ? '✓' : '✗';
    echo "  $status $testName: $result\n";
}

echo "\n";

if ($passedTests === $totalTests) {
    echo "🎉 ALL TESTS PASSED! 🎉\n";
    echo "The BC_Agents application is ready for production deployment.\n\n";
    
    echo "Next Steps:\n";
    echo "1. Deploy to your Apache web server\n";
    echo "2. Set proper file permissions (see README.md)\n";
    echo "3. Configure environment in .htaccess (SetEnv APP_ENV prod)\n";
    echo "4. Update database credentials in .env.prod\n";
    echo "5. Test applications at /bconsiteagentapp and /bcoracleagentapp\n";
    echo "6. Monitor health endpoints: /bconsiteagentapp/health and /bcoracleagentapp/health\n";
} else {
    echo "⚠️  SOME TESTS FAILED ⚠️\n";
    echo "Please review the failed tests above and fix any issues before deployment.\n";
}

echo "\nFor detailed deployment instructions, see README.md\n";
?>
