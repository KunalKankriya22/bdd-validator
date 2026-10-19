<?php

namespace App\Middleware;

use App\Utils\SessionManager;

class AuthMiddleware
{
    /**
     * Check if the user is authenticated
     *
     * @return bool
     */
    public static function isAuthenticated(): bool
    {
        return SessionManager::has('user') && !empty(SessionManager::get('user'));
    }

    /**
     * Require authentication to access a page
     *
     * @param string $redirectTo
     * @return void
     */
    public static function requireAuth(string $redirectTo = '/login'): void
    {
        if (!self::isAuthenticated()) {
            // Redirect to login page
            header('Location: ' . $redirectTo);
            exit;
        }
    }

    /**
     * Redirect if user is already authenticated
     *
     * @param string $redirectTo
     * @return void
     */
    public static function redirectIfAuthenticated(string $redirectTo = '/'): void
    {
        if (self::isAuthenticated()) {
            header('Location: ' . $redirectTo);
            exit;
        }
    }

    /**
     * Get the authenticated user
     *
     * @return array|null
     */
    public static function getUser(): ?array
    {
        return SessionManager::get('user');
    }
    
    /**
     * Regenerate session ID after login to prevent session fixation
     *
     * @return void
     */
    public static function regenerateSession(): void
    {
        SessionManager::regenerateId();
    }
    
    /**
     * Log out the user
     *
     * @return void
     */
    public static function logout(): void
    {
        SessionManager::destroy();
    }
}
