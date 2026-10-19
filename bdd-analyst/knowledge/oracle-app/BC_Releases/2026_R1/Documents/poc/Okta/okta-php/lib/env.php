<?php
/**
 * Custom .env File Parser
 * 
 * This file contains functions for loading environment variables from .env files
 * without external dependencies.
 */

require_once __DIR__ . '/common.php';

/**
 * Parse a .env file and load variables into environment
 * 
 * @param string $filePath Path to the .env file
 * @return bool True if successful
 */
function parseEnvFile($filePath) {
    if (!file_exists($filePath)) {
        return false;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return false;
    }
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse variable assignment
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Remove quotes if present
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }
            
            // Set environment variable
            if (!empty($name)) {
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
    
    return true;
}

/**
 * Load environment variables from .env file
 * 
 * @param string $environment Environment name (dev, qa, prod)
 * @return bool True if successful
 */
function loadEnvironment($environment = null) {
    // If no environment specified, try to detect it
    if ($environment === null) {
        // Check for environment variable
        if (getenv('APP_ENV')) {
            $environment = getenv('APP_ENV');
        } 
        // Check for server hostname patterns
        else if (isset($_SERVER['SERVER_NAME'])) {
            $hostname = $_SERVER['SERVER_NAME'];
            
            if (strpos($hostname, 'dev') !== false || strpos($hostname, 'localhost') !== false) {
                $environment = 'dev';
            } else if (strpos($hostname, 'qa') !== false || strpos($hostname, 'test') !== false) {
                $environment = 'qa';
            } else {
                $environment = 'prod';
            }
        } 
        // Default to development
        else {
            $environment = 'dev';
        }
    }
    
    // Define the .env file paths
    $envFile = __DIR__ . '/../.env.' . $environment;
    $defaultEnvFile = __DIR__ . '/../.env';
    
    $loaded = false;
    
    // Try to load environment-specific .env file
    if (file_exists($envFile)) {
        $loaded = parseEnvFile($envFile);
        if ($loaded) {
            logMessage("Loaded environment variables from $envFile", 'INFO');
        }
    } 
    // Fall back to default .env file
    else if (file_exists($defaultEnvFile)) {
        $loaded = parseEnvFile($defaultEnvFile);
        if ($loaded) {
            logMessage("Loaded environment variables from $defaultEnvFile", 'INFO');
        }
    }
    
    if (!$loaded) {
        logMessage("No .env file found for environment: $environment", 'WARNING');
    } else {
        // Set APP_ENV if not already set
        if (!getenv('APP_ENV')) {
            putenv("APP_ENV=$environment");
            $_ENV['APP_ENV'] = $environment;
            $_SERVER['APP_ENV'] = $environment;
        }
    }
    
    return $loaded;
}

/**
 * Get an environment variable with fallback
 * 
 * @param string $key Environment variable name
 * @param mixed $default Default value if not found
 * @return mixed Environment variable value or default
 */
function env($key, $default = null) {
    $value = getenv($key);
    
    if ($value === false) {
        return $default;
    }
    
    // Convert string representations to actual types
    switch (strtolower($value)) {
        case 'true':
        case '(true)':
            return true;
        case 'false':
        case '(false)':
            return false;
        case 'null':
        case '(null)':
            return null;
        case 'empty':
        case '(empty)':
            return '';
    }
    
    return $value;
}
