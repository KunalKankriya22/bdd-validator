<?php
/**
 * Check Requirements Script
 * 
 * This script checks if all required PHP extensions are installed.
 */

// Start output buffering to prevent any output before headers
ob_start();

// Required extensions
$requiredExtensions = [
    'oci8' => 'Oracle OCI8 extension is required for database connectivity.',
    'curl' => 'cURL extension is required for making HTTP requests.',
    'json' => 'JSON extension is required for processing API responses.',
    'openssl' => 'OpenSSL extension is required for secure connections.'
];

// Check each required extension
$missingExtensions = [];
foreach ($requiredExtensions as $extension => $message) {
    if (!extension_loaded($extension)) {
        $missingExtensions[$extension] = $message;
    }
}

// If there are missing extensions, display an error
if (!empty($missingExtensions)) {
    // Clear output buffer
    ob_end_clean();
    
    // Set content type
    header('Content-Type: text/html; charset=utf-8');
    
    // Display error page
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Missing Requirements - Okta PHP Application</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .error-container {
            background-color: #f8f8f8;
            border-left: 4px solid #e74c3c;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        h1 {
            color: #e74c3c;
        }
        ul {
            margin-top: 20px;
        }
        li {
            margin-bottom: 10px;
        }
        .install-instructions {
            background-color: #f8f8f8;
            border-left: 4px solid #3498db;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        code {
            background-color: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: Consolas, Monaco, "Andale Mono", monospace;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Missing Requirements</h1>
        <p>The following PHP extensions are required but not installed:</p>
        <ul>';
    
    foreach ($missingExtensions as $extension => $message) {
        echo "<li><strong>$extension</strong>: $message</li>";
    }
    
    echo '</ul>
    </div>
    
    <div class="install-instructions">
        <h2>Installation Instructions</h2>
        
        <h3>OCI8 Extension</h3>
        <p>To install the OCI8 extension:</p>
        <ol>
            <li>Download the Oracle Instant Client from the <a href="https://www.oracle.com/database/technologies/instant-client/downloads.html" target="_blank">Oracle website</a>.</li>
            <li>Install the Instant Client on your system.</li>
            <li>Install the OCI8 extension using PECL: <code>pecl install oci8</code></li>
            <li>Add <code>extension=oci8</code> to your php.ini file.</li>
        </ol>
        
        <h3>Other Extensions</h3>
        <p>For other extensions, you can usually install them using your package manager:</p>
        <p>On Ubuntu/Debian: <code>sudo apt-get install php-curl php-json php-openssl</code></p>
        <p>On CentOS/RHEL: <code>sudo yum install php-curl php-json php-openssl</code></p>
        <p>On Windows with XAMPP: Enable the extensions in the php.ini file.</p>
    </div>
</body>
</html>';
    
    // Stop script execution
    exit;
}

// Clear output buffer if no errors
ob_end_clean();

// If this script is included in another file, return true to indicate all requirements are met
return true;
