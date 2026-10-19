<?php
/**
 * Okta PHP Application - Home Page
 * 
 * This page provides links to the BCOnsite and BCOracle applications.
 */

// Check requirements
require_once 'check_requirements.php';

// Include environment handling
require_once 'lib/env.php';

// Load environment variables
loadEnvironment();

// Get current environment
$environment = env('APP_ENV', 'dev');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="<?php echo env('BASE_HREF', '/'); ?>">
    <title>Okta PHP Application</title>
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
        .environment {
            display: inline-block;
            padding: 3px 8px;
            background-color: #e74c3c;
            color: white;
            border-radius: 4px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .environment.dev {
            background-color: #2ecc71;
        }
        .environment.qa {
            background-color: #f39c12;
        }
        .app-links {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 30px;
        }
        .app-link {
            flex: 1;
            min-width: 200px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 20px;
            text-align: center;
            text-decoration: none;
            color: #333;
            transition: all 0.3s ease;
        }
        .app-link:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .app-link h2 {
            margin-top: 0;
            color: #3498db;
        }
        .app-link p {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            Okta PHP Authentication Application
            <span class="environment <?php echo htmlspecialchars($environment); ?>"><?php echo htmlspecialchars(strtoupper($environment)); ?></span>
        </h1>
        <p>This application provides OAuth 2.0 authentication with Okta for two different clients.</p>
        
        <div class="app-links">
            <a href="bconsiteapp/" class="app-link">
                <h2>BCOnsite</h2>
                <p>Authentication for BCOnsite client</p>
            </a>
            
            <a href="bcoracleapp/" class="app-link">
                <h2>BCOracle</h2>
                <p>Authentication for BCOracle client</p>
            </a>
        </div>
        
        <div class="app-links">
            <a href="examples/session_example.php" class="app-link">
                <h2>Session Example</h2>
                <p>Demonstrates SessionManager usage</p>
            </a>
            
            <a href="examples/auth_example.php" class="app-link">
                <h2>Auth Example</h2>
                <p>Demonstrates OktaAuth usage</p>
            </a>
        </div>
    </div>
</body>
</html>
