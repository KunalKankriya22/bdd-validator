<?php
/**
 * BCOracle Application
 * 
 * This application handles authentication with Okta for the BCOracle client.
 * Uses SessionManager for secure session handling and environment-specific configurations.
 */

// Check requirements
require_once '../check_requirements.php';

// Include required libraries
require_once '../lib/common.php';
require_once '../lib/env.php';
require_once '../lib/config.php';
require_once '../lib/session.php';
require_once '../lib/auth.php';
require_once '../lib/database.php';

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
        $auth = new OktaAuth($config->getOktaConfig('oracle'), $session);
        
        // Check if we should also log out from Okta
        $oktaLogout = isset($_GET['okta']) && $_GET['okta'] === 'true';
        $logoutUrl = $auth->logout($oktaLogout);
        
        if ($logoutUrl) {
            // Redirect to Okta logout endpoint
            header("Location: $logoutUrl");
        } else {
            // Redirect to home page
            header('Location: /');
        }
        exit();
    }
    
    // Initialize authentication
    $oktaConfig = $config->getOktaConfig('oracle');
    $auth = new OktaAuth($oktaConfig, $session);
    
    // Check if user is already authenticated
    if ($auth->isAuthenticated() && !isset($_GET['code'])) {
        // User is already authenticated, redirect to application
        $userinfo = (object) $auth->getUser();
        
        // Initialize database
        $db = new Database($config->getDatabaseConfig());
        
        // Store user info and get unique ID
        $uniqueId = $db->storeUserInfo($userinfo->username);
        
        // Build redirect URL
        $sessionUrl = $oktaConfig['redirect_url'] . $uniqueId;
        
        // Redirect to the application
        header("Location: $sessionUrl");
        exit();
    }
    
    // Check if this is a callback from Okta
    if (!isset($_GET['code'])) {
        // Not a callback, start the authentication flow
        $authorizeUrl = $auth->startAuthFlow(
            $oktaConfig['client_id'],
            $oktaConfig['redirect_uri']
        );
        
        // Redirect to Okta for authentication
        header("Location: $authorizeUrl");
        exit();
    } else {
        // This is a callback from Okta, handle it
        $userinfo = $auth->handleCallback(
            $_GET,
            $oktaConfig['client_id'],
            $oktaConfig['client_secret'],
            $oktaConfig['redirect_uri']
        );
        
        // Store user information in the database
        if ($userinfo->sub) {
            // Initialize database
            $db = new Database($config->getDatabaseConfig());
            
            // Store user info and get unique ID
            $uniqueId = $db->storeUserInfo($userinfo->preferred_username);
            
            // Build redirect URL
            $sessionUrl = $oktaConfig['redirect_url'] . $uniqueId;
            
            // Redirect to the application
            header("Location: $sessionUrl");
            exit();
        } else {
            displayError("Authentication successful, but no user information was returned.");
        }
    }
} catch (Exception $e) {
    logMessage("Application error: " . $e->getMessage(), 'ERROR');
    displayError("Application error: " . $e->getMessage());
}
