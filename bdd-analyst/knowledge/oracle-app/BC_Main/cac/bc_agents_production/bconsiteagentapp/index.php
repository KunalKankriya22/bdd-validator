<?php
/**
 * Blood Center Onsite Agent Application
 * 
 * This application handles authentication redirects for blood center onsite agents.
 * It uses the shared BCAgentCore library for common functionality.
 * 
 * @author Blood Center Development Team
 * @version 2.0.0
 * @since 2025-10-16
 */

// Include the shared core library
require_once __DIR__ . '/../shared/BCAgentCore.php';

// Initialize and run the application
try {
    $configPath = __DIR__ . '/config.ini.php';
    $app = new BCAgentApp($configPath, 'bconsiteagent');
    $app->run();
} catch (Exception $e) {
    // Final catch-all error handler
    error_log("BCOnsiteAgent Critical Error: " . $e->getMessage());
    http_response_code(500);
    exit('Service temporarily unavailable. Please contact support.');
}
?>
