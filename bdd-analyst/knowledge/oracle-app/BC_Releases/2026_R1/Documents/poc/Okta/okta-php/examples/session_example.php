<?php
/**
 * Example of using SessionManager and configuration system
 * 
 * This example demonstrates how to use the SessionManager class and
 * the configuration system in your own code.
 */

// Include required libraries
require_once '../lib/common.php';
require_once '../lib/env.php';
require_once '../lib/config.php';
require_once '../lib/session.php';

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
    
    // Get the current environment
    $environment = $config->getEnvironment();
    
    // Initialize session manager
    $session = new SessionManager($config);
    $session->start();
    
    // Set a session variable
    $session->set('example_key', 'example_value');
    
    // Get a value from environment variables
    $dbConn = env('DB_CONN', 'default_connection');
    
    // Get a value from the config file
    // This will get the value from app.ini.php
    $exampleValue = $config->get('example_key', 'default_value');
    
    // Get another value from environment variables with a default
    $verifySSL = env('OKTA_VERIFY_SSL', false);
    
    // Check if user is authenticated
    $isAuthenticated = $session->isAuthenticated();
    
    // Output information
    echo "<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Session Example</title>
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
    </style>
</head>
<body>
    <div class='container'>
        <h1>Session and Configuration Example</h1>
        
        <div class='info'>
            <span class='key'>Current Environment:</span> " . htmlspecialchars($environment) . "
        </div>
        
        <div class='info'>
            <span class='key'>Session ID:</span> " . htmlspecialchars(session_id()) . "
        </div>
        
        <div class='info'>
            <span class='key'>Session Variable 'example_key':</span> " . htmlspecialchars($session->get('example_key')) . "
        </div>
        
        <div class='info'>
            <span class='key'>Database Connection:</span> " . htmlspecialchars($dbConn) . "
        </div>
        
        <div class='info'>
            <span class='key'>Example Config Value:</span> " . htmlspecialchars($exampleValue) . "
        </div>
        
        <div class='info'>
            <span class='key'>Verify SSL:</span> " . ($verifySSL ? 'Yes' : 'No') . "
        </div>
        
        <div class='info'>
            <span class='key'>User Authenticated:</span> " . ($isAuthenticated ? 'Yes' : 'No') . "
        </div>";
    
    // If user is authenticated, show user info
    if ($isAuthenticated) {
        $user = $session->getUser();
        echo "
        <div class='info'>
            <span class='key'>Username:</span> " . htmlspecialchars($user['username']) . "
        </div>
        
        <div class='info'>
            <span class='key'>User ID (sub):</span> " . htmlspecialchars($user['sub']) . "
        </div>
        
        <div class='info'>
            <span class='key'>Authenticated At:</span> " . date('Y-m-d H:i:s', $user['authenticated_at']) . "
        </div>";
    }
    
    echo "
    </div>
</body>
</html>";

} catch (Exception $e) {
    logMessage("Example error: " . $e->getMessage(), 'ERROR');
    echo "Error: " . htmlspecialchars($e->getMessage());
}
