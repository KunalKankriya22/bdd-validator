<?php
/**
 * Session Management Library for Okta PHP Applications
 * 
 * This file contains the SessionManager class for handling session operations.
 */

require_once __DIR__ . '/common.php';

/**
 * Class to handle session management
 */
class SessionManager {
  private $config;
  private $sessionStarted = false;
  private $sessionTimeout;
  
  /**
   * Constructor
   * 
   * @param Config $config Configuration object
   */
  public function __construct($config) {
    $this->config = $config;
    $this->sessionTimeout = $config->get('session_timeout', 1800); // Default 30 minutes
    
    // Set secure session parameters
    ini_set('session.use_strict_mode', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_httponly', 1);
    
    // Set secure cookie if using HTTPS
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
      ini_set('session.cookie_secure', 1);
    }
    
    // Set session name based on environment
    $environment = $config->getEnvironment();
    session_name("okta_app_" . $environment);
    
    logMessage("SessionManager initialized for environment: $environment", 'INFO');
  }
  
  /**
   * Start the session
   * 
   * @return bool True if session started successfully
   */
  public function start() {
    if ($this->sessionStarted) {
      return true;
    }
    
    // Start the session
    $result = session_start();
    $this->sessionStarted = $result;
    
    if ($result) {
      // Check if session is valid
      if (!$this->validateSession()) {
        // Session is invalid, destroy it and start a new one
        $this->destroy();
        session_start();
      }
      
      // Update last activity time
      $_SESSION['last_activity'] = time();
      
      logMessage("Session started with ID: " . session_id(), 'INFO');
    } else {
      logMessage("Failed to start session", 'ERROR');
    }
    
    return $result;
  }
  
  /**
   * Validate the current session
   * 
   * @return bool True if session is valid
   */
  public function validateSession() {
    // Check if session has necessary data
    if (!isset($_SESSION['created'])) {
      // New session, set created time
      $_SESSION['created'] = time();
      return true;
    }
    
    // Check for session timeout
    if (isset($_SESSION['last_activity'])) {
      $inactiveTime = time() - $_SESSION['last_activity'];
      
      if ($inactiveTime > $this->sessionTimeout) {
        logMessage("Session timeout after $inactiveTime seconds of inactivity", 'INFO');
        return false;
      }
    }
    
    // Check for session fixation attempts by validating user agent
    if (isset($_SESSION['user_agent'])) {
      if ($_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
        logMessage("Possible session fixation attempt: User-Agent mismatch", 'WARNING');
        return false;
      }
    } else {
      $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
    }
    
    // Regenerate session ID periodically for security
    $sessionMaxLifetime = $this->config->get('session_max_lifetime', 86400); // Default 24 hours
    if (time() - $_SESSION['created'] > $sessionMaxLifetime) {
      logMessage("Regenerating session ID after " . $sessionMaxLifetime . " seconds", 'INFO');
      $this->regenerateId();
      $_SESSION['created'] = time();
    }
    
    return true;
  }
  
  /**
   * Regenerate the session ID
   * 
   * @param bool $deleteOldSession Whether to delete the old session data
   * @return bool True if successful
   */
  public function regenerateId($deleteOldSession = false) {
    return session_regenerate_id($deleteOldSession);
  }
  
  /**
   * Destroy the session
   * 
   * @return bool True if successful
   */
  public function destroy() {
    if (!$this->sessionStarted) {
      return false;
    }
    
    // Clear session data
    $_SESSION = [];
    
    // Delete the session cookie
    if (ini_get("session.use_cookies")) {
      $params = session_get_cookie_params();
      setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
      );
    }
    
    // Destroy the session
    $result = session_destroy();
    $this->sessionStarted = false;
    
    logMessage("Session destroyed", 'INFO');
    return $result;
  }
  
  /**
   * Set a session variable
   * 
   * @param string $key Key
   * @param mixed $value Value
   * @return void
   */
  public function set($key, $value) {
    if (!$this->sessionStarted) {
      $this->start();
    }
    
    $_SESSION[$key] = $value;
  }
  
  /**
   * Get a session variable
   * 
   * @param string $key Key
   * @param mixed $default Default value if key is not found
   * @return mixed Value or default
   */
  public function get($key, $default = null) {
    if (!$this->sessionStarted) {
      $this->start();
    }
    
    return isset($_SESSION[$key]) ? $_SESSION[$key] : $default;
  }
  
  /**
   * Remove a session variable
   * 
   * @param string $key Key
   * @return void
   */
  public function remove($key) {
    if (!$this->sessionStarted) {
      $this->start();
    }
    
    unset($_SESSION[$key]);
  }
  
  /**
   * Check if a session variable exists
   * 
   * @param string $key Key
   * @return bool True if exists
   */
  public function has($key) {
    if (!$this->sessionStarted) {
      $this->start();
    }
    
    return isset($_SESSION[$key]);
  }
  
  /**
   * Check if user is authenticated
   * 
   * @return bool True if authenticated
   */
  public function isAuthenticated() {
    return $this->has('sub') && $this->has('username');
  }
  
  /**
   * Get authenticated user information
   * 
   * @return array|null User information or null if not authenticated
   */
  public function getUser() {
    if (!$this->isAuthenticated()) {
      return null;
    }
    
    return [
      'sub' => $this->get('sub'),
      'username' => $this->get('username'),
      'authenticated_at' => $this->get('authenticated_at')
    ];
  }
  
  /**
   * Set authenticated user information
   * 
   * @param object $userinfo User information from Okta
   * @return void
   */
  public function setUser($userinfo) {
    $this->set('sub', $userinfo->sub);
    $this->set('username', $userinfo->preferred_username);
    $this->set('authenticated_at', time());
    
    // Regenerate session ID for security
    $this->regenerateId(true);
    
    logMessage("User authenticated: {$userinfo->preferred_username}", 'INFO');
  }
}
