<?php
/**
 * Example of using OktaAuth with SessionManager
 * 
 * This example demonstrates how to use the OktaAuth class with SessionManager
 * for a custom application.
 */

// Include required libraries
require_once '../lib/common.php';
require_once '../lib/env.php';
require_once '../lib/config.php';
require_once '../lib/session.php';
require_once '../lib/auth.php';

// Initialize error handling
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    logMessage("PHP Error [$errno]: $errstr in $errfile on line $errline", 'ERROR');
    return false; // Let PHP handle the error as well
});

try {
    // Load environment variables from .env file
    loadEnvironment();
    
    // Load configuration with automatic environment detection
    $config = new Config();
    
    // Initialize session manager
    $session = new SessionManager($config);
    $session->start();
    
    // Handle logout
    if (isset($_GET['logout'])) {
        $auth = new OktaAuth($config->getOktaConfig('onsite'), $session);
        
        // Check if we should also log out from Okta
        $oktaLogout = isset($_GET['okta']) && $_GET['okta'] === 'true';
        $logoutUrl = $auth->logout($oktaLogout);
        
        if ($logoutUrl) {
            // Redirect to Okta logout endpoint
            header("Location: $logoutUrl");
        } else {
            // Redirect back to this page
            header('Location: ' . $_SERVER['PHP_SELF']);
        }
        exit();
    }
    
    // Initialize authentication
    $oktaConfig = $config->getOktaConfig('onsite');
    $auth = new OktaAuth($oktaConfig, $session);
    
    // Check if this is a callback from Okta
    if (isset($_GET['code'])) {
        // This is a callback from Okta, handle it
        $userinfo = $auth->handleCallback(
            $_GET,
            $oktaConfig['client_id'],
            $oktaConfig['client_secret'],
            $oktaConfig['redirect_uri']
        );
        
        // Redirect back to this page without the code parameter
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit();
    }
    
    // Check if user is authenticated
    $isAuthenticated = $auth->isAuthenticated();
    
    // Output information
    echo "<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Authentication Example</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f8f8f8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
            border-left: 4px solid #3498db;
        }
        h1 {
            color: #3498db;
        }
        .info {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .key {
            font-weight: bold;
            color: #555;
        }
        .button {
            display: inline-block;
            padding: 10px 15px;
            background-color: #3498db;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .button:hover {
            background-color: #2980b9;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>Authentication Example</h1>
        
        <div class='info'>
            <span class='key'>Current Environment:</span> " . htmlspecialchars($config->getEnvironment()) . "
        </div>
        
        <div class='info'>
            <span class='key'>Session ID:</span> " . htmlspecialchars(session_id()) . "
        </div>
        
        <div class='info'>
            <span class='key'>User Authenticated:</span> " . ($isAuthenticated ? 'Yes' : 'No') . "
        </div>
        
        <div class='info'>
            <span class='key'>Using Environment:</span> " . htmlspecialchars(env('APP_ENV', 'Not set')) . "
        </div>
        
        <div class='info'>
            <span class='key'>Verify SSL:</span> " . (env('OKTA_VERIFY_SSL', false) ? 'Yes' : 'No') . "
        </div>";
    
    // If user is authenticated, show user info and logout button
    if ($isAuthenticated) {
        $user = $auth->getUser();
        echo "
        <div class='info'>
            <span class='key'>Username:</span> " . htmlspecialchars($user['username']) . "
        </div>
        
        <div class='info'>
            <span class='key'>User ID (sub):</span> " . htmlspecialchars($user['sub']) . "
        </div>
        
        <div class='info'>
            <span class='key'>Authenticated At:</span> " . date('Y-m-d H:i:s', $user['authenticated_at']) . "
        </div>
        
        <a href='?logout' class='button'>Logout</a>
        <a href='?logout&okta=true' class='button'>Logout from Okta</a>";
    } else {
        // Not authenticated, show login button
        // Start the authentication flow
        $authorizeUrl = $auth->startAuthFlow(
            $oktaConfig['client_id'],
            $oktaConfig['redirect_uri']
        );
        
        echo "
        <p>You are not authenticated. Click the button below to log in with Okta.</p>
        <a href='" . htmlspecialchars($authorizeUrl) . "' class='button'>Login with Okta</a>";
    }
    
    echo "
    </div>
</body>
</html>";

} catch (Exception $e) {
    logMessage("Example error: " . $e->getMessage(), 'ERROR');
    echo "Error: " . htmlspecialchars($e->getMessage());
}
