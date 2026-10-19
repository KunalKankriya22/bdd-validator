<?php
/**
 * Blood Center Agent Core Library
 * 
 * Shared logic for both bconsiteagentapp and bcoracleagentapp
 * 
 * @author Blood Center Development Team
 * @version 2.0.0
 * @since 2025-10-16
 */

/**
 * Custom exception class for application errors
 */
class BCAgentException extends Exception {}

/**
 * Environment configuration loader
 */
class EnvLoader {
    private static $config = null;
    
    public static function load($environment = null) {
        if (self::$config !== null) {
            return self::$config;
        }
        
        // Determine environment from APP_ENV (set in .htaccess)
        if ($environment === null) {
            $environment = $_ENV['APP_ENV'] ?? 'qa';
        }
        
        $envFile = __DIR__ . "/../.env.{$environment}";
        
        if (!file_exists($envFile)) {
            throw new BCAgentException("Environment file not found: {$envFile}");
        }
        
        $config = [];
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            if (strpos($line, '#') === 0) continue; // Skip comments
            
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $config[trim($key)] = trim($value);
            }
        }
        
        self::$config = $config;
        return $config;
    }
    
    public static function get($key, $default = null) {
        if (self::$config === null) {
            self::load();
        }
        
        return isset(self::$config[$key]) ? self::$config[$key] : $default;
    }
}

/**
 * Logger class for application logging
 */
class Logger {
    private static $logFile;
    private static $logLevel;
    
    public static function init($appName = 'bcagent', $logLevel = 'INFO') {
        self::$logLevel = $logLevel;
        self::$logFile = __DIR__ . '/../logs/' . $appName . '_' . date('Y-m-d') . '.log';
        
        // Create logs directory if it doesn't exist
        $logDir = dirname(self::$logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }
    
    private static function shouldLog($level) {
        $levels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3, 'CRITICAL' => 4];
        $currentLevel = $levels[self::$logLevel] ?? 1;
        $messageLevel = $levels[$level] ?? 1;
        
        return $messageLevel >= $currentLevel;
    }
    
    public static function log($level, $message, $context = []) {
        if (!self::shouldLog($level)) {
            return;
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' | Context: ' . json_encode($context) : '';
        $logEntry = "[$timestamp] [$level] $message$contextStr" . PHP_EOL;
        
        error_log($logEntry, 3, self::$logFile);
        
        // Also log to system error log for critical errors
        if (in_array($level, ['ERROR', 'CRITICAL'])) {
            error_log("BCAgent [$level]: $message");
        }
    }
    
    public static function debug($message, $context = []) {
        self::log('DEBUG', $message, $context);
    }
    
    public static function info($message, $context = []) {
        self::log('INFO', $message, $context);
    }
    
    public static function warning($message, $context = []) {
        self::log('WARNING', $message, $context);
    }
    
    public static function error($message, $context = []) {
        self::log('ERROR', $message, $context);
    }
    
    public static function critical($message, $context = []) {
        self::log('CRITICAL', $message, $context);
    }
}

/**
 * Configuration manager class
 */
class Config {
    private static $config = null;
    private static $appConfig = null;
    
    public static function load($configPath, $appName = null) {
        if (self::$config !== null) {
            return self::$config;
        }
        
        // Load environment variables
        $envConfig = EnvLoader::load();
        
        // Auto-detect application name if not provided
        if ($appName === null) {
            $appName = self::detectApplicationName();
        }
        
        // Build configuration from environment variables
        $config = [
            'database' => [
                'db_conn' => $envConfig['DB_CONN'] ?? '',
                'db_user' => $envConfig['DB_USER'] ?? '',
                'db_password' => $envConfig['DB_PASSWORD'] ?? ''
            ],
            'application' => [
                'app_redirect_url' => self::getAppRedirectUrl($appName, $envConfig)
            ],
            'agent' => [
                'map_edi' => $envConfig['AGENT_MAP_EDI'] ?? 'DOD_EDIPN_ID',
                'map_unique' => $envConfig['AGENT_MAP_UNIQUE'] ?? 'UNIQUE_ID'
            ]
        ];
        
        // Validate required configuration sections
        $requiredSections = ['database', 'application', 'agent'];
        foreach ($requiredSections as $section) {
            if (!isset($config[$section])) {
                throw new BCAgentException("Missing required configuration section: $section");
            }
        }
        
        // Check if Oracle Wallet authentication is enabled
        $useWalletAuth = filter_var($envConfig['USE_WALLET_AUTH'] ?? 'false', FILTER_VALIDATE_BOOLEAN);
        
        // Validate required configuration keys (password not required for wallet authentication)
        $databaseKeys = $useWalletAuth ? ['db_conn', 'db_user'] : ['db_conn', 'db_user', 'db_password'];
        $requiredKeys = [
            'database' => $databaseKeys,
            'application' => ['app_redirect_url'],
            'agent' => ['map_edi', 'map_unique']
        ];
        
        foreach ($requiredKeys as $section => $keys) {
            foreach ($keys as $key) {
                if (!isset($config[$section][$key]) || empty($config[$section][$key])) {
                    throw new BCAgentException("Missing required configuration key: $section.$key");
                }
            }
        }
        
        // Log wallet authentication status for debugging
        if ($useWalletAuth) {
            Logger::info('Oracle Wallet authentication enabled - password validation skipped');
        }
        
        self::$config = $config;
        return $config;
    }
    
    /**
     * Detect application name from request path
     */
    private static function detectApplicationName() {
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        
        // Check script name first
        if (strpos($scriptName, 'bconsiteagentapp') !== false) {
            return 'bconsiteagent';
        }
        if (strpos($scriptName, 'bcoracleagentapp') !== false) {
            return 'bcoracleagent';
        }
        
        // Check request URI
        if (strpos($requestUri, 'bconsiteagentapp') !== false) {
            return 'bconsiteagent';
        }
        if (strpos($requestUri, 'bcoracleagentapp') !== false) {
            return 'bcoracleagent';
        }
        
        // Default to bconsiteagent if cannot detect
        return 'bconsiteagent';
    }
    
    /**
     * Get application-specific redirect URL
     */
    private static function getAppRedirectUrl($appName, $envConfig) {
        switch ($appName) {
            case 'bconsiteagent':
                return $envConfig['BCONSITEAGENT_REDIRECT_URL'] ?? '';
            case 'bcoracleagent':
                return $envConfig['BCORACLEAGENT_REDIRECT_URL'] ?? '';
            default:
                return $envConfig['BCONSITEAGENT_REDIRECT_URL'] ?? '';
        }
    }
    
    public static function loadAppConfig() {
        if (self::$appConfig !== null) {
            return self::$appConfig;
        }
        
        $appConfigPath = __DIR__ . '/../settings/app.ini.php';
        
        if (!file_exists($appConfigPath)) {
            throw new BCAgentException("App configuration file not found: $appConfigPath");
        }
        
        $appConfig = parse_ini_file($appConfigPath, true);
        if ($appConfig === false) {
            throw new BCAgentException("Failed to parse app configuration file");
        }
        
        self::$appConfig = $appConfig;
        return $appConfig;
    }
    
    public static function get($section, $key = null) {
        if (self::$config === null) {
            throw new BCAgentException("Configuration not loaded. Call Config::load() first.");
        }
        
        if ($key === null) {
            return isset(self::$config[$section]) ? self::$config[$section] : null;
        }
        
        return isset(self::$config[$section][$key]) ? self::$config[$section][$key] : null;
    }
    
    public static function getApp($section, $key = null) {
        if (self::$appConfig === null) {
            self::loadAppConfig();
        }
        
        if ($key === null) {
            return isset(self::$appConfig[$section]) ? self::$appConfig[$section] : null;
        }
        
        return isset(self::$appConfig[$section][$key]) ? self::$appConfig[$section][$key] : null;
    }
}

/**
 * Database connection manager
 */
class Database {
    private static $connection = null;
    
    public static function connect() {
        if (self::$connection !== null) {
            return self::$connection;
        }
        
        $dbConfig = Config::get('database');
        
        try {
            $connection = oci_connect(
                $dbConfig['db_user'],
                $dbConfig['db_password'],
                $dbConfig['db_conn'],
                'UTF8'
            );
            
            if (!$connection) {
                $error = oci_error();
                throw new BCAgentException("Database connection failed: " . $error['message']);
            }
            
            self::$connection = $connection;
            Logger::info('Database connection established');
            return $connection;
            
        } catch (Exception $e) {
            Logger::critical('Database connection failed', ['error' => $e->getMessage()]);
            throw new BCAgentException("Database connection failed");
        }
    }
    
    public static function disconnect() {
        if (self::$connection !== null) {
            oci_close(self::$connection);
            self::$connection = null;
            Logger::info('Database connection closed');
        }
    }
}

/**
 * Input validator class
 */
class Validator {
    public static function validateHeader($value, $maxLength = 255) {
        if (empty($value)) {
            return false;
        }
        
        // Check for null bytes and control characters first
        if (preg_match('/[\x00-\x1F\x7F]/', $value)) {
            return false;
        }
        
        // Check length
        if (strlen($value) > $maxLength) {
            return false;
        }
        
        // Basic alphanumeric and common special characters only
        if (!preg_match('/^[a-zA-Z0-9\-_@.]+$/', $value)) {
            return false;
        }
        
        return $value;
    }
    
    public static function validateUrl($url) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
}

/**
 * Rate limiter class (simple implementation)
 */
class RateLimiter {
    private static $requestFile;
    
    public static function init() {
        self::$requestFile = __DIR__ . '/../tmp/rate_limit_' . date('Y-m-d-H') . '.json';
        
        // Create tmp directory if it doesn't exist
        $tmpDir = dirname(self::$requestFile);
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }
    }
    
    public static function checkLimit($identifier, $maxRequests = null, $timeWindow = 3600) {
        // Get rate limiting settings from environment
        $envConfig = EnvLoader::load();
        $rateLimitingEnabled = filter_var($envConfig['ENABLE_RATE_LIMITING'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
        
        if (!$rateLimitingEnabled) {
            return true;
        }
        
        if ($maxRequests === null) {
            $maxRequests = (int)($envConfig['MAX_REQUESTS_PER_HOUR'] ?? 100);
        }
        
        self::init();
        
        $requests = [];
        if (file_exists(self::$requestFile)) {
            $content = file_get_contents(self::$requestFile);
            $requests = json_decode($content, true) ?: [];
        }
        
        $currentTime = time();
        $requests[$identifier] = isset($requests[$identifier]) ? $requests[$identifier] : [];
        
        // Remove old requests outside time window
        $requests[$identifier] = array_filter($requests[$identifier], function($timestamp) use ($currentTime, $timeWindow) {
            return ($currentTime - $timestamp) < $timeWindow;
        });
        
        // Check if limit exceeded
        if (count($requests[$identifier]) >= $maxRequests) {
            return false;
        }
        
        // Add current request
        $requests[$identifier][] = $currentTime;
        
        // Save updated requests
        file_put_contents(self::$requestFile, json_encode($requests), LOCK_EX);
        
        return true;
    }
}

/**
 * Main application class
 */
class BCAgentApp {
    private $config;
    private $connection;
    private $appName;
    
    public function __construct($configPath, $appName = 'bcagent') {
        $this->appName = $appName;
        
        // Load environment configuration
        $envConfig = EnvLoader::load();
        $logLevel = $envConfig['LOG_LEVEL'] ?? 'INFO';
        
        Logger::init($appName, $logLevel);
        $this->config = Config::load($configPath);
        
        // Set error reporting based on environment
        $environment = $envConfig['ENVIRONMENT'] ?? 'production';
        if ($environment === 'development') {
            error_reporting(E_ALL);
            ini_set('display_errors', '1');
        } else {
            error_reporting(E_ALL);
            ini_set('display_errors', '0');
        }
        ini_set('log_errors', '1');
        
        // Set security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Enforce HTTPS in production if enabled
        $httpsRedirect = filter_var($envConfig['ENABLE_HTTPS_REDIRECT'] ?? 'true', FILTER_VALIDATE_BOOLEAN);
        if ($httpsRedirect && (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on')) {
            if (!in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1'])) {
                $redirectURL = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
                header("Location: $redirectURL", true, 301);
                exit();
            }
        }
    }
    
    public function run() {
        try {
            // Health check endpoint
            if ($_SERVER['REQUEST_URI'] === '/health' || strpos($_SERVER['REQUEST_URI'], '/health') !== false) {
                $this->healthCheck();
                return;
            }
            
            // Rate limiting
            $clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            if (!RateLimiter::checkLimit($clientIp)) {
                Logger::error('Rate limit exceeded', ['ip' => $clientIp]);
                http_response_code(429);
                header('Retry-After: 3600');
                exit('Rate limit exceeded. Please try again later.');
            }
            
            Logger::info('Processing request', [
                'ip' => $clientIp, 
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'app' => $this->appName
            ]);
            
            // Get and validate headers
            $headers = $this->getRequestHeaders();
            $identifiers = $this->extractIdentifiers($headers);
            
            // Connect to database
            $this->connection = Database::connect();
            
            // Generate session and store data
            $sessionData = $this->createSession($identifiers);
            
            // Redirect to application
            $this->redirectToApp($sessionData['ename']);
            
        } catch (BCAgentException $e) {
            Logger::error('Application error', ['error' => $e->getMessage(), 'app' => $this->appName]);
            http_response_code(500);
            exit('Application error occurred. Please contact support.');
            
        } catch (Exception $e) {
            Logger::critical('Unexpected error', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString(),
                'app' => $this->appName
            ]);
            http_response_code(500);
            exit('An unexpected error occurred. Please contact support.');
            
        } finally {
            Database::disconnect();
        }
    }
    
    private function healthCheck() {
        try {
            // Test database connection
            $conn = Database::connect();
            $testSql = 'SELECT 1 FROM DUAL';
            $stmt = oci_parse($conn, $testSql);
            $result = oci_execute($stmt);
            oci_free_statement($stmt);
            
            if ($result) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode([
                    'status' => 'healthy', 
                    'timestamp' => time(),
                    'app' => $this->appName,
                    'version' => Config::getApp('application', 'app_version')
                ]);
            } else {
                throw new Exception('Database test failed');
            }
        } catch (Exception $e) {
            Logger::error('Health check failed', ['error' => $e->getMessage(), 'app' => $this->appName]);
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'unhealthy', 
                'error' => 'Database connection failed',
                'app' => $this->appName
            ]);
        } finally {
            Database::disconnect();
        }
        exit();
    }
    
    private function getRequestHeaders() {
        $headers = [];
        
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
        } else {
            // Fallback for non-Apache servers
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header = str_replace('_', '-', substr($key, 5));
                    $headers[$header] = $value;
                }
            }
        }
        
        if (empty($headers)) {
            throw new BCAgentException('No request headers found');
        }
        
        return $headers;
    }
    
    private function extractIdentifiers($headers) {
        $agentConfig = Config::get('agent');
        $ediPinId = null;
        $uniqueId = null;
        $source = 'headers';
        
        // Extract identifiers from headers (case-insensitive)
        foreach ($headers as $header => $value) {
            if (strcasecmp($header, $agentConfig['map_edi']) === 0) {
                $ediPinId = Validator::validateHeader($value);
            }
            if (strcasecmp($header, $agentConfig['map_unique']) === 0) {
                $uniqueId = Validator::validateHeader($value);
            }
        }
        
        // If no identifiers found in headers, check $_ENV variables
        if (empty($ediPinId) && empty($uniqueId)) {
            $source = 'environment';
            
            // Check $_ENV for EDI Pin ID
            if (isset($_ENV[$agentConfig['map_edi']]) && !empty($_ENV[$agentConfig['map_edi']])) {
                $ediPinId = Validator::validateHeader($_ENV[$agentConfig['map_edi']]);
            }
            
            // Check $_ENV for Unique ID
            if (isset($_ENV[$agentConfig['map_unique']]) && !empty($_ENV[$agentConfig['map_unique']])) {
                $uniqueId = Validator::validateHeader($_ENV[$agentConfig['map_unique']]);
            }
        }
        
        // Use unique ID only if EDI Pin ID is empty
        $evalue = !empty($ediPinId) ? $ediPinId : $uniqueId;
        
        if (empty($evalue)) {
            Logger::error('No valid identifier found in headers or environment variables', [
                'headers' => array_keys($headers),
                'env_keys_checked' => [$agentConfig['map_edi'], $agentConfig['map_unique']],
                'app' => $this->appName
            ]);
            throw new BCAgentException('Required authentication headers or environment variables not found or invalid');
        }
        
        Logger::info('Identifiers extracted', [
            'source' => $source,
            'has_edi' => !empty($ediPinId),
            'has_unique' => !empty($uniqueId),
            'using' => !empty($ediPinId) ? 'edi' : 'unique',
            'app' => $this->appName
        ]);
        
        return $evalue;
    }
    
    private function createSession($evalue) {
        $ename = $this->generateSecureSessionId();
        
        $sql = 'INSERT INTO edi (ename, evalue) VALUES (:ename, :evalue)';
        
        try {
            $compiled = oci_parse($this->connection, $sql);
            if (!$compiled) {
                $error = oci_error($this->connection);
                throw new BCAgentException("SQL parse error: " . $error['message']);
            }
            
            oci_bind_by_name($compiled, ':ename', $ename);
            oci_bind_by_name($compiled, ':evalue', $evalue);
            
            $result = oci_execute($compiled, OCI_COMMIT_ON_SUCCESS);
            if (!$result) {
                $error = oci_error($compiled);
                throw new BCAgentException("SQL execution error: " . $error['message']);
            }
            
            oci_free_statement($compiled);
            
            Logger::info('Session created successfully', ['ename' => $ename, 'app' => $this->appName]);
            
            return ['ename' => $ename, 'evalue' => $evalue];
            
        } catch (Exception $e) {
            Logger::error('Failed to create session', ['error' => $e->getMessage(), 'app' => $this->appName]);
            throw new BCAgentException('Failed to create session');
        }
    }
    
    private function generateSecureSessionId() {
        // Generate a cryptographically secure session ID
        $bytes = random_bytes(16);
        return bin2hex($bytes) . '_' . time();
    }
    
    private function redirectToApp($ename) {
        $appConfig = Config::get('application');
        $baseUrl = $appConfig['app_redirect_url'];
        
        // Handle URL construction based on protocol
        if (preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/$/', $baseUrl)) {
            // URL ends with :// (like bcapp2026r1-prddb://) - append directly
            $redirectUrl = $baseUrl . urlencode($ename);
        } else {
            // Standard URL - use rtrim and add slash
            $redirectUrl = rtrim($baseUrl, '/') . '/' . urlencode($ename);
        }
        
        // Validate the redirect URL
        if (!Validator::validateUrl($redirectUrl)) {
            Logger::error('URL validation failed', ['url' => $redirectUrl, 'base_url' => $baseUrl, 'app' => $this->appName]);
            throw new BCAgentException('Invalid redirect URL configuration');
        }
        
        Logger::info('Redirect URL constructed', ['url' => $redirectUrl, 'app' => $this->appName]);
        
        // Use 302 redirect (temporary) for security
        header("Location: $redirectUrl", true, 302);
        exit();
    }
}
?>
