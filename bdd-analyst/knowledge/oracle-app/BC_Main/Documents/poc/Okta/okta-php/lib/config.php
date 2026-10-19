<?php
/**
 * Configuration Library for Okta PHP Applications
 * 
 * This file contains functions for handling application configuration.
 * Supports environment-specific configurations and .env files.
 */

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/env.php';

/**
 * Class to handle application configuration
 */
class Config {
  private $config = [];
  private $configFile;
  private $environment;
  
  /**
   * Constructor
   * 
   * @param string $configFile Path to the configuration file (optional)
   */
  public function __construct($configFile = null) {
    // Load environment variables from .env file
    loadEnvironment();
    
    // Detect environment
    $this->detectEnvironment();
    
    // Use the specified config file or default to app.ini.php
    if ($configFile === null) {
      $this->configFile = __DIR__ . '/../settings/app.ini.php';
    } else {
      $this->configFile = $configFile;
    }
    
    $this->loadConfig();
  }
  
  /**
   * Detect the current environment
   * 
   * @return string Environment name (dev, qa, prod)
   */
  public function detectEnvironment() {
    // Use APP_ENV from .env file if available
    $appEnv = env('APP_ENV');
    if ($appEnv) {
      $this->environment = $appEnv;
    } 
    // Check for server hostname patterns as fallback
    else if (isset($_SERVER['SERVER_NAME'])) {
      $hostname = $_SERVER['SERVER_NAME'];
      
      if (strpos($hostname, 'dev') !== false || strpos($hostname, 'localhost') !== false) {
        $this->environment = 'dev';
      } else if (strpos($hostname, 'qa') !== false || strpos($hostname, 'test') !== false) {
        $this->environment = 'qa';
      } else {
        $this->environment = 'prod';
      }
    } 
    // Default to development
    else {
      $this->environment = 'dev';
    }
    
    logMessage("Detected environment: {$this->environment}", 'INFO');
    return $this->environment;
  }
  
  
  /**
   * Load configuration from file
   * 
   * @return void
   * @throws Exception If configuration cannot be loaded
   */
  private function loadConfig() {
    try {
      // Load base configuration from PHP file
      $this->config = loadConfig($this->configFile);
      logMessage("Loaded configuration from {$this->configFile}", 'INFO');
      
      // Add environment to the configuration
      $this->config['environment'] = $this->environment;
      
    } catch (Exception $e) {
      logMessage("Failed to load configuration: " . $e->getMessage(), 'ERROR');
      displayError("Failed to load application configuration. Please check the configuration file.");
    }
    
    // Validate required configuration
    $this->validateConfig();
  }
  
  /**
   * Validate that all required environment variables are present
   * 
   * @return void
   * @throws Exception If required environment variables are missing
   */
  private function validateConfig() {
    // Database configuration
    $requiredDbEnv = ['DB_CONN', 'DB_USER', 'DB_PASSWORD'];
    foreach ($requiredDbEnv as $envVar) {
      if (env($envVar) === null) {
        logMessage("Missing required environment variable: $envVar", 'ERROR');
        displayError("Missing required environment variable: $envVar");
      }
    }
    
    // Okta configuration
    $requiredOktaEnv = ['OKTA_METADATA_URL'];
    foreach ($requiredOktaEnv as $envVar) {
      if (env($envVar) === null) {
        logMessage("Missing required environment variable: $envVar", 'ERROR');
        displayError("Missing required environment variable: $envVar");
      }
    }
    
    // Application configuration
    $requiredAppEnv = ['BASE_HREF'];
    foreach ($requiredAppEnv as $envVar) {
      if (env($envVar) === null) {
        logMessage("Missing required environment variable: $envVar", 'ERROR');
        displayError("Missing required environment variable: $envVar");
      }
    }
    
    logMessage("Environment validation successful", 'INFO');
  }
  
  /**
   * Get the current environment
   * 
   * @return string Environment name (dev, qa, prod)
   */
  public function getEnvironment() {
    return $this->environment;
  }
  
  /**
   * Get a configuration value
   * 
   * @param string $key Configuration key
   * @param mixed $default Default value if key is not found
   * @return mixed Configuration value or default
   */
  public function get($key, $default = null) {
    // Get value from config file
    return isset($this->config[$key]) ? $this->config[$key] : $default;
  }
  
  /**
   * Get all configuration values
   * 
   * @return array All configuration values
   */
  public function getAll() {
    return $this->config;
  }
  
  /**
   * Get database configuration
   * 
   * @return array Database configuration
   */
  public function getDatabaseConfig() {
    return [
      'db_conn' => env('DB_CONN'),
      'db_user' => env('DB_USER'),
      'db_password' => env('DB_PASSWORD')
    ];
  }
  
  /**
   * Get Okta configuration for a specific client
   * 
   * @param string $clientType Client type (onsite or oracle)
   * @return array Okta configuration for the specified client
   */
  public function getOktaConfig($clientType) {
    $clientId = env("OKTA_{$clientType}_CLIENT_ID");
    $clientSecret = env("OKTA_{$clientType}_CLIENT_SECRET");
    $redirectUri = env("OKTA_{$clientType}_REDIRECT_URI");
    $redirectUrl = env("OKTA_{$clientType}_REDIRECT_URL");
    
    if (!$clientId || !$clientSecret || !$redirectUri || !$redirectUrl) {
      logMessage("Missing Okta configuration for client type: $clientType", 'ERROR');
      displayError("Missing Okta configuration for client type: $clientType");
    }
    
    // Default to false for SSL verification in development environments
    // In production, this should be set to true
    $verifySSL = env('OKTA_VERIFY_SSL', false);
    
    return [
      'client_id' => $clientId,
      'client_secret' => $clientSecret,
      'redirect_uri' => $redirectUri,
      'redirect_url' => $redirectUrl,
      'metadata_url' => env('OKTA_METADATA_URL'),
      'verify_ssl' => $verifySSL
    ];
  }
}
