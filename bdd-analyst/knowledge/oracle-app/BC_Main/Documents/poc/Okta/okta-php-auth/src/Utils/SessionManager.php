<?php

namespace App\Utils;

class SessionManager
{
    /**
     * Start a secure session
     *
     * @param array $options Session options
     * @return bool
     */
    public static function start(array $options = []): bool
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return true;
        }
        
        // Default session options
        $defaultOptions = [
            'cookie_httponly' => true,     // Prevent JavaScript access to session cookie
            'cookie_secure' => EnvLoader::get('APP_ENV') === 'production', // Require HTTPS in production
            'cookie_samesite' => 'Lax',    // Prevent CSRF attacks
            'use_strict_mode' => true,     // Prevent session fixation
            'gc_maxlifetime' => 7200,      // Session timeout (2 hours)
            'cookie_lifetime' => 0,        // Session cookie expires when browser is closed
        ];
        
        // Merge default options with provided options
        $sessionOptions = array_merge($defaultOptions, $options);
        
        // Set session options
        foreach ($sessionOptions as $key => $value) {
            ini_set('session.' . $key, $value);
        }
        
        // Start the session
        return session_start();
    }
    
    /**
     * Regenerate the session ID
     *
     * @param bool $deleteOldSession Whether to delete the old session data
     * @return bool
     */
    public static function regenerateId(bool $deleteOldSession = true): bool
    {
        return session_regenerate_id($deleteOldSession);
    }
    
    /**
     * Set a session value
     *
     * @param string $key
     * @param mixed $value
     * @return void
     */
    public static function set(string $key, $value): void
    {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get a session value
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if a session value exists
     *
     * @param string $key
     * @return bool
     */
    public static function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove a session value
     *
     * @param string $key
     * @return void
     */
    public static function remove(string $key): void
    {
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
        }
    }
    
    /**
     * Get all session values
     *
     * @return array
     */
    public static function all(): array
    {
        return $_SESSION;
    }
    
    /**
     * Clear all session values
     *
     * @return void
     */
    public static function clear(): void
    {
        session_unset();
    }
    
    /**
     * Destroy the session
     *
     * @return bool
     */
    public static function destroy(): bool
    {
        self::clear();
        
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        
        return session_destroy();
    }
    
}
