<?php
/**
 * Blood Center Oracle Agent Application
 * 
 * This application handles authentication redirects for blood center oracle agents.
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
    $app = new BCAgentApp($configPath, 'bcoracleagent');
    $app->run();
} catch (Exception $e) {
    // Final catch-all error handler
    error_log("BCOracleAgent Critical Error: " . $e->getMessage());
    http_response_code(500);

    // TEMPORARY DEBUG: Show actual error (REMOVE IN PRODUCTION!)
    echo '<h1>Debug Error Details</h1>';
    echo '<p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p><strong>File:</strong> ' . htmlspecialchars($e->getFile()) . ':' . $e->getLine() . '</p>';
    echo '<pre><strong>Stack Trace:</strong>' . "\n" . htmlspecialchars($e->getTraceAsString()) . '</pre>';
    exit();
}
?>
