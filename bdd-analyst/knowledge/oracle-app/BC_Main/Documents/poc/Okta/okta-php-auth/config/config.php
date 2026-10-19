<?php

// Load required classes
require_once __DIR__ . '/../src/Utils/EnvLoader.php';

use App\Utils\EnvLoader;

// Load environment variables
EnvLoader::load(__DIR__ . '/../.env', false);

// If .env file doesn't exist, try to use .env.example
if (!file_exists(__DIR__ . '/../.env')) {
    EnvLoader::load(__DIR__ . '/../.env.example', false);
}

// Define configuration array
return [
    'okta' => [
        'issuer' => EnvLoader::get('OKTA_ISSUER', 'https://{yourOktaDomain}/oauth2/default'),
        'clientId' => EnvLoader::get('OKTA_CLIENT_ID', '{yourClientId}'),
        'clientSecret' => EnvLoader::get('OKTA_CLIENT_SECRET', '{yourClientSecret}'),
        'redirectUri' => EnvLoader::get('OKTA_REDIRECT_URI', 'http://localhost:8000/callback'),
        'scopes' => EnvLoader::get('OKTA_SCOPES', 'openid profile email'),
    ],
    'app' => [
        'url' => EnvLoader::get('APP_URL', 'http://localhost:8000'),
        'env' => EnvLoader::get('APP_ENV', 'development'),
        'debug' => EnvLoader::get('APP_DEBUG', EnvLoader::get('APP_ENV') !== 'production'),
        'log_path' => EnvLoader::get('APP_LOG_PATH', __DIR__ . '/../logs/app.log'),
    ],
    'security' => [
        'session_lifetime' => EnvLoader::get('SESSION_LIFETIME', 7200), // 2 hours
        'secure_cookies' => EnvLoader::get('SECURE_COOKIES', EnvLoader::get('APP_ENV') === 'production'),
    ]
];
