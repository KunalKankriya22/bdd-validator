<?php
/**
 * Common Library for Okta PHP Applications
 * 
 * This file contains shared functions and utilities used across the application.
 */

/**
 * Base64-urlencoding for OAuth 2.0 PKCE
 * 
 * Instead of +/ we use -_, and the trailing = are removed.
 * 
 * @param string $string The string to encode
 * @return string The base64-url encoded string
 */
function base64_urlencode($string) {
  return rtrim(strtr(base64_encode($string), '+/', '-_'), '=');
}

/**
 * Make an HTTP request with proper error handling
 * 
 * @param string $url The URL to request
 * @param array|bool $params Optional POST parameters
 * @param bool $verifySSL Whether to verify SSL certificates (default: true)
 * @return object|false JSON decoded response or false on error
 * @throws Exception If the request fails
 */
function http($url, $params = false, $verifySSL = true) {
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $verifySSL);
  curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
  
  if ($params) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
  }
  
  $response = curl_exec($ch);
  $error = curl_error($ch);
  $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  
  if ($error) {
    throw new Exception("HTTP request failed: $error");
  }
  
  if ($statusCode >= 400) {
    throw new Exception("HTTP request failed with status code: $statusCode, Response: $response");
  }
  
  $decoded = json_decode($response);
  if (json_last_error() !== JSON_ERROR_NONE) {
    throw new Exception("Failed to decode JSON response: " . json_last_error_msg());
  }
  
  return $decoded;
}

/**
 * Load configuration from INI file
 * 
 * @param string $file Path to the INI file
 * @return array Configuration array
 * @throws Exception If the file cannot be read
 */
function loadConfig($file) {
  if (!file_exists($file)) {
    throw new Exception("Configuration file not found: $file");
  }
  
  $config = parse_ini_file($file);
  if ($config === false) {
    throw new Exception("Failed to parse configuration file: $file");
  }
  
  return $config;
}

/**
 * Connect to Oracle database with error handling
 * 
 * @param array $config Database configuration
 * @return resource Oracle connection resource
 * @throws Exception If connection fails
 */
function connectToDatabase($config) {
  if (!isset($config['db_user']) || !isset($config['db_password']) || !isset($config['db_conn'])) {
    throw new Exception("Missing database configuration parameters");
  }
  
  $conn = @oci_connect($config['db_user'], $config['db_password'], $config['db_conn']);
  
  if (!$conn) {
    $error = oci_error();
    throw new Exception("Database connection failed: " . $error['message']);
  }
  
  return $conn;
}

/**
 * Execute an Oracle SQL query with proper error handling
 * 
 * @param resource $conn Oracle connection resource
 * @param string $sql SQL query
 * @param array $params Bind parameters
 * @return resource Statement resource
 * @throws Exception If query execution fails
 */
function executeQuery($conn, $sql, $params = []) {
  // Check if connection is valid
  if (!$conn) {
    throw new Exception("Cannot execute query: Invalid database connection");
  }
  
  $stmt = oci_parse($conn, $sql);
  if (!$stmt) {
    $error = oci_error($conn);
    throw new Exception("Failed to parse SQL: " . $error['message']);
  }
  
  foreach ($params as $name => $value) {
    oci_bind_by_name($stmt, $name, $params[$name]);
  }
  
  $result = oci_execute($stmt);
  if (!$result) {
    $error = oci_error($stmt);
    throw new Exception("Failed to execute SQL: " . $error['message']);
  }
  
  return $stmt;
}

/**
 * Log a message to the application log
 * 
 * @param string $message Message to log
 * @param string $level Log level (INFO, WARNING, ERROR)
 * @return void
 */
function logMessage($message, $level = 'INFO') {
  $timestamp = date('Y-m-d H:i:s');
  $logMessage = "[$timestamp] [$level] $message" . PHP_EOL;
  
  $logDir = __DIR__ . '/../logs';
  if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
  }
  
  $logFile = $logDir . '/app.log';
  file_put_contents($logFile, $logMessage, FILE_APPEND);
}

/**
 * Generate a secure random state for OAuth 2.0
 * 
 * @param int $length Length of the random string
 * @return string Random hex string
 */
function generateSecureState($length = 16) {
  return bin2hex(random_bytes($length));
}

/**
 * Generate a secure code verifier for PKCE
 * 
 * @param int $length Length of the random string
 * @return string Random hex string
 */
function generateCodeVerifier($length = 64) {
  return bin2hex(random_bytes($length));
}

/**
 * Display an error message and terminate the script
 * 
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 * @return void
 */
function displayError($message, $statusCode = 400) {
  logMessage($message, 'ERROR');
  
  // Redirect to error page with message and code
  $errorUrl = '/error.php?message=' . urlencode($message) . '&code=' . $statusCode;
  header("Location: $errorUrl");
  exit();
}
