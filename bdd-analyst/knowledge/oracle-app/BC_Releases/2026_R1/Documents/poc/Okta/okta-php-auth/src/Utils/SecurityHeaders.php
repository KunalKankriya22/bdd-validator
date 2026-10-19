<?php

namespace App\Utils;

class SecurityHeaders
{
    /**
     * Set security headers for the application
     *
     * @param bool $isProduction Whether the application is running in production mode
     * @return void
     */
    public static function set(bool $isProduction = false): void
    {
        // Content Security Policy (CSP)
        // Adjust this policy based on your application's needs
        $cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // Allow Bootstrap JS
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",  // Allow Bootstrap CSS
            "img-src 'self' data:",
            "font-src 'self' https://cdn.jsdelivr.net", // Allow Bootstrap fonts
            "connect-src 'self'",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];
        
        // Set CSP header
        header("Content-Security-Policy: " . implode('; ', $cspDirectives));
        
        // X-Content-Type-Options
        // Prevents browsers from MIME-sniffing a response away from the declared content-type
        header('X-Content-Type-Options: nosniff');
        
        // X-Frame-Options
        // Prevents your page from being placed in an iframe
        header('X-Frame-Options: SAMEORIGIN');
        
        // X-XSS-Protection
        // Enables the cross-site scripting (XSS) filter in browsers
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer-Policy
        // Controls how much referrer information should be included with requests
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Feature-Policy
        // Allows a site to control which features and APIs can be used in the browser
        header("Feature-Policy: geolocation 'self'; microphone 'none'; camera 'none'");
        
        // Strict-Transport-Security (HSTS)
        // Forces browsers to use HTTPS for the specified domain
        if ($isProduction) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Cache control
        // Prevents caching of sensitive information
        if ($isProduction) {
            // Allow caching in production for better performance
            header('Cache-Control: public, max-age=31536000');
        } else {
            // Disable caching in development
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
        }
    }
    
    /**
     * Force HTTPS in production
     *
     * @return void
     */
    public static function forceHttps(): void
    {
        if (
            EnvLoader::get('APP_ENV') === 'production' &&
            (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on')
        ) {
            $redirectUrl = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
            header('HTTP/1.1 301 Moved Permanently');
            header('Location: ' . $redirectUrl);
            exit;
        }
    }
}
