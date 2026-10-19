<?php

namespace App\Utils;

class EnvLoader
{
    /**
     * Load environment variables from a file
     *
     * @param string $path Path to the .env file
     * @param bool $required Whether the file is required
     * @return bool
     */
    public static function load(string $path, bool $required = true): bool
    {
        if (!file_exists($path)) {
            if ($required) {
                throw new \RuntimeException("Environment file not found: $path");
            }
            return false;
        }
        
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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
                
                // Remove quotes if present
                if (
                    (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) ||
                    (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1)
                ) {
                    $value = substr($value, 1, -1);
                }
                
                // Set as environment variable
                putenv("$name=$value");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
        
        return true;
    }
    
    /**
     * Get an environment variable
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        $value = getenv($key);
        
        if ($value === false) {
            return $default;
        }
        
        // Convert specific string values to their proper types
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
    
    /**
     * Check if an environment variable exists
     *
     * @param string $key
     * @return bool
     */
    public static function has(string $key): bool
    {
        return getenv($key) !== false;
    }
    
    /**
     * Get all environment variables
     *
     * @return array
     */
    public static function all(): array
    {
        return $_ENV;
    }
}
