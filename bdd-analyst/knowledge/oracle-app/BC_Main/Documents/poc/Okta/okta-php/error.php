<?php
/**
 * Error Page
 * 
 * This page displays user-friendly error messages.
 */

// Get error message from query parameter
$errorMessage = isset($_GET['message']) ? htmlspecialchars($_GET['message']) : 'An unknown error occurred.';
$errorCode = isset($_GET['code']) ? intval($_GET['code']) : 500;

// Set HTTP status code
http_response_code($errorCode);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Okta PHP Application</title>
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
        .back-link {
            display: inline-block;
            margin-top: 20px;
            color: #3498db;
            text-decoration: none;
        }
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>Error</h1>
        <p><?php echo $errorMessage; ?></p>
        <p>Please try again later or contact the system administrator if the problem persists.</p>
        <a href="/" class="back-link">← Return to Home</a>
    </div>
</body>
</html>
