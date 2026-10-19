<?php

namespace App\Utils;

class ErrorHandler
{
    private $logFile;
    private $isProduction;

    /**
     * Constructor
     *
     * @param string $logFile Path to the log file
     * @param bool $isProduction Whether the application is running in production mode
     */
    public function __construct(string $logFile, bool $isProduction)
    {
        $this->logFile = $logFile;
        $this->isProduction = $isProduction;
    }

    /**
     * Register error handlers
     *
     * @return void
     */
    public function register(): void
    {
        // Set error handler
        set_error_handler([$this, 'handleError']);
        
        // Set exception handler
        set_exception_handler([$this, 'handleException']);
        
        // Register shutdown function
        register_shutdown_function([$this, 'handleShutdown']);
        
        // Configure error reporting
        if ($this->isProduction) {
            error_reporting(E_ALL);
            ini_set('display_errors', 0);
            ini_set('log_errors', 1);
            ini_set('error_log', $this->logFile);
        } else {
            error_reporting(E_ALL);
            ini_set('display_errors', 1);
            ini_set('log_errors', 1);
            ini_set('error_log', $this->logFile);
        }
    }

    /**
     * Handle errors
     *
     * @param int $errno Error number
     * @param string $errstr Error message
     * @param string $errfile File where the error occurred
     * @param int $errline Line where the error occurred
     * @return bool
     */
    public function handleError(int $errno, string $errstr, string $errfile, int $errline): bool
    {
        // Log the error
        $this->logError("Error [$errno] $errstr in $errfile on line $errline");
        
        // Display error in development mode
        if (!$this->isProduction) {
            echo "<div style='background-color: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border: 1px solid #f5c6cb; border-radius: 4px;'>";
            echo "<h3>Error</h3>";
            echo "<p><strong>Type:</strong> $errno</p>";
            echo "<p><strong>Message:</strong> $errstr</p>";
            echo "<p><strong>File:</strong> $errfile</p>";
            echo "<p><strong>Line:</strong> $errline</p>";
            echo "</div>";
        }
        
        // Don't execute PHP's internal error handler
        return true;
    }

    /**
     * Handle exceptions
     *
     * @param \Throwable $exception
     * @return void
     */
    public function handleException(\Throwable $exception): void
    {
        // Log the exception
        $this->logError(
            "Exception: " . $exception->getMessage() . 
            " in " . $exception->getFile() . 
            " on line " . $exception->getLine() . 
            "\nStack trace: " . $exception->getTraceAsString()
        );
        
        // Display error in development mode
        if (!$this->isProduction) {
            echo "<div style='background-color: #f8d7da; color: #721c24; padding: 10px; margin: 10px 0; border: 1px solid #f5c6cb; border-radius: 4px;'>";
            echo "<h3>Exception</h3>";
            echo "<p><strong>Type:</strong> " . get_class($exception) . "</p>";
            echo "<p><strong>Message:</strong> " . $exception->getMessage() . "</p>";
            echo "<p><strong>File:</strong> " . $exception->getFile() . "</p>";
            echo "<p><strong>Line:</strong> " . $exception->getLine() . "</p>";
            echo "<h4>Stack Trace:</h4>";
            echo "<pre>" . $exception->getTraceAsString() . "</pre>";
            echo "</div>";
        } else {
            // In production, show a generic error page
            http_response_code(500);
            include __DIR__ . '/../Views/500.php';
        }
    }

    /**
     * Handle fatal errors
     *
     * @return void
     */
    public function handleShutdown(): void
    {
        $error = error_get_last();
        
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            // Log the error
            $this->logError(
                "Fatal Error: " . $error['message'] . 
                " in " . $error['file'] . 
                " on line " . $error['line']
            );
            
            // In production, show a generic error page
            if ($this->isProduction) {
                http_response_code(500);
                include __DIR__ . '/../Views/500.php';
            }
        }
    }

    /**
     * Log an error message
     *
     * @param string $message
     * @return void
     */
    private function logError(string $message): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        
        // Create log directory if it doesn't exist
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Create log file if it doesn't exist
        if (!file_exists($this->logFile)) {
            touch($this->logFile);
            chmod($this->logFile, 0644);
        }
        
        // Append to log file
        file_put_contents($this->logFile, $logMessage, FILE_APPEND);
    }
}
