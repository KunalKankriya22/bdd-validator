<?php

// Load required classes
require_once __DIR__ . '/../src/Auth/OktaAuthService.php';
require_once __DIR__ . '/../src/Middleware/AuthMiddleware.php';
require_once __DIR__ . '/../src/Utils/EnvLoader.php';
require_once __DIR__ . '/../src/Utils/ErrorHandler.php';
require_once __DIR__ . '/../src/Utils/SessionManager.php';
require_once __DIR__ . '/../src/Utils/SecurityHeaders.php';

// Load configuration
$config = require_once __DIR__ . '/../config/config.php';

// Import classes
use App\Auth\OktaAuthService;
use App\Middleware\AuthMiddleware;
use App\Utils\EnvLoader;
use App\Utils\ErrorHandler;
use App\Utils\SessionManager;
use App\Utils\SecurityHeaders;

// Initialize error handler
$errorHandler = new ErrorHandler(
    $config['app']['log_path'],
    $config['app']['env'] === 'production'
);
$errorHandler->register();

// Start secure session
SessionManager::start([
    'cookie_secure' => $config['security']['secure_cookies'],
    'gc_maxlifetime' => $config['security']['session_lifetime'],
]);

// Set security headers
SecurityHeaders::set($config['app']['env'] === 'production');

// Force HTTPS in production
SecurityHeaders::forceHttps();

// Initialize Okta Auth Service
$oktaAuth = new OktaAuthService($config);

// Simple router
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$path = rtrim($path, '/');

// Routes
switch ($path) {
    case '':
    case '/':
        // Home page
        if (AuthMiddleware::isAuthenticated()) {
            $user = AuthMiddleware::getUser();
            include __DIR__ . '/../src/Views/home.php';
        } else {
            include __DIR__ . '/../src/Views/welcome.php';
        }
        break;

    case '/login':
        // Login page
        AuthMiddleware::redirectIfAuthenticated();
        $authUrl = $oktaAuth->getAuthorizationUrl();
        include __DIR__ . '/../src/Views/login.php';
        break;

    case '/callback':
        // Okta callback
        AuthMiddleware::redirectIfAuthenticated();
        
        // Verify state parameter to prevent CSRF
        if (!isset($_GET['state']) || !$oktaAuth->validateState($_GET['state'])) {
            header('Location: /login');
            exit;
        }

        // Exchange authorization code for tokens
        if (isset($_GET['code'])) {
            try {
                $tokens = $oktaAuth->getTokens($_GET['code']);
                
                if (!empty($tokens) && isset($tokens['id_token'], $tokens['access_token'])) {
                    // Verify ID token
                    $idTokenClaims = $oktaAuth->verifyIdToken($tokens['id_token']);
                    
                    if ($idTokenClaims) {
                        // Get user info
                        $userInfo = $oktaAuth->getUserInfo($tokens['access_token']);
                        
                        // Regenerate session ID to prevent session fixation
                        AuthMiddleware::regenerateSession();
                        
                        // Store tokens and user info in session
                        SessionManager::set('id_token', $tokens['id_token']);
                        SessionManager::set('access_token', $tokens['access_token']);
                        SessionManager::set('user', $userInfo);
                        
                        // Redirect to home page
                        header('Location: /');
                        exit;
                    } else {
                        throw new \Exception('Invalid ID token');
                    }
                } else {
                    throw new \Exception('Invalid token response');
                }
            } catch (\Exception $e) {
                // Log the error
                error_log('Authentication error: ' . $e->getMessage());
                
                // Redirect to login page
                header('Location: /login');
                exit;
            }
        } else {
            // No code parameter
            header('Location: /login');
            exit;
        }
        break;

    case '/logout':
        // Get Okta logout URL before destroying the session
        $logoutUrl = $oktaAuth->getLogoutUrl();
        
        // Properly logout using AuthMiddleware
        AuthMiddleware::logout();
        
        // Redirect to Okta logout
        header('Location: ' . $logoutUrl);
        exit;
        break;

    case '/profile':
        // Profile page
        AuthMiddleware::requireAuth();
        $user = AuthMiddleware::getUser();
        include __DIR__ . '/../src/Views/profile.php';
        break;

    default:
        // 404 page
        http_response_code(404);
        include __DIR__ . '/../src/Views/404.php';
        break;
}
