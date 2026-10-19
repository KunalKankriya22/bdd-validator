<?php
/**
 * Authentication Library for Okta PHP Applications
 * 
 * This file contains functions for handling OAuth 2.0 authentication with Okta.
 * Integrated with SessionManager for secure session handling.
 */

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/session.php';

/**
 * Class to handle OAuth 2.0 authentication with Okta
 */
class OktaAuth {
  private $config;
  private $metadata;
  private $session;
  
  /**
   * Constructor
   * 
   * @param array $config Configuration array
   * @param SessionManager $session Session manager instance (optional)
   */
  public function __construct($config, $session = null) {
    $this->config = $config;
    
    // Initialize session manager if not provided
    if ($session === null) {
      // We need a Config object for the SessionManager
      if (!($config instanceof Config)) {
        $configObj = new Config();
        $this->session = new SessionManager($configObj);
      } else {
        $this->session = new SessionManager($config);
      }
    } else {
      $this->session = $session;
    }
    
    // Start the session
    $this->session->start();
    
    // Determine if SSL verification should be enabled
    // For development environments, it may need to be disabled
    $verifySSL = isset($config['verify_ssl']) ? (bool)$config['verify_ssl'] : false;
    
    try {
      $this->metadata = http($config['metadata_url'], false, $verifySSL);
      logMessage("Loaded OAuth 2.0 metadata from {$config['metadata_url']}", 'INFO');
    } catch (Exception $e) {
      logMessage("Failed to load OAuth 2.0 metadata: " . $e->getMessage(), 'ERROR');
      displayError("Failed to initialize authentication. Please try again later.");
    }
  }
  
  /**
   * Start the OAuth 2.0 authorization flow
   * 
   * @param string $clientId Client ID
   * @param string $redirectUri Redirect URI
   * @return string Authorization URL
   */
  public function startAuthFlow($clientId, $redirectUri) {
    // Generate and store state and code verifier
    $state = generateSecureState();
    $codeVerifier = generateCodeVerifier();
    
    $this->session->set('state', $state);
    $this->session->set('code_verifier', $codeVerifier);
    
    // Generate code challenge from code verifier
    $codeChallenge = base64_urlencode(hash('sha256', $codeVerifier, true));
    
    // Build authorization URL
    $authParams = [
      'response_type' => 'code',
      'client_id' => $clientId,
      'redirect_uri' => $redirectUri,
      'state' => $state,
      'scope' => 'openid profile',
      'code_challenge' => $codeChallenge,
      'code_challenge_method' => 'S256',
    ];
    
    $authorizeUrl = $this->metadata->authorization_endpoint . '?' . http_build_query($authParams);
    logMessage("Starting OAuth flow for client $clientId", 'INFO');
    
    return $authorizeUrl;
  }
  
  /**
   * Handle the OAuth 2.0 callback
   * 
   * @param array $params Request parameters
   * @param string $clientId Client ID
   * @param string $clientSecret Client secret
   * @param string $redirectUri Redirect URI
   * @return object User info object
   * @throws Exception If authentication fails
   */
  public function handleCallback($params, $clientId, $clientSecret, $redirectUri) {
    // Verify state parameter
    if (!$this->session->has('state') || $this->session->get('state') !== $params['state']) {
      logMessage("State parameter mismatch", 'ERROR');
      throw new Exception("Invalid state parameter. Authentication failed.");
    }
    
    // Check for errors
    if (isset($params['error'])) {
      logMessage("OAuth error: {$params['error']}", 'ERROR');
      throw new Exception("Authentication error: " . htmlspecialchars($params['error']));
    }
    
    // Exchange authorization code for tokens
    try {
      $tokenParams = [
        'grant_type' => 'authorization_code',
        'code' => $params['code'],
        'redirect_uri' => $redirectUri,
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code_verifier' => $this->session->get('code_verifier'),
      ];
      
      // Determine if SSL verification should be enabled
      $verifySSL = isset($this->config['verify_ssl']) ? (bool)$this->config['verify_ssl'] : false;
      
      $response = http($this->metadata->token_endpoint, $tokenParams, $verifySSL);
      
      if (!isset($response->access_token)) {
        throw new Exception("No access token in response");
      }
      
      // Get user info
      $userinfo = http($this->metadata->userinfo_endpoint, ['access_token' => $response->access_token], $verifySSL);
      
      // Store user info in session
      $this->session->setUser($userinfo);
      
      // Store tokens in session for potential later use
      $this->session->set('access_token', $response->access_token);
      if (isset($response->refresh_token)) {
        $this->session->set('refresh_token', $response->refresh_token);
      }
      if (isset($response->id_token)) {
        $this->session->set('id_token', $response->id_token);
      }
      
      logMessage("Successfully authenticated user: {$userinfo->preferred_username}", 'INFO');
      return $userinfo;
      
    } catch (Exception $e) {
      logMessage("Token exchange failed: " . $e->getMessage(), 'ERROR');
      throw new Exception("Authentication failed: " . $e->getMessage());
    }
  }
  
  /**
   * Log the user out
   * 
   * @param bool $oktaLogout Whether to also log out from Okta (default: false)
   * @return string|null Okta logout URL if $oktaLogout is true, null otherwise
   */
  public function logout($oktaLogout = false) {
    // Get user info before destroying session
    $user = $this->session->getUser();
    
    // Destroy the session
    $this->session->destroy();
    
    if ($user) {
      logMessage("User {$user['username']} logged out", 'INFO');
    } else {
      logMessage("User logged out", 'INFO');
    }
    
    // If requested, return Okta logout URL
    if ($oktaLogout && isset($this->metadata->end_session_endpoint)) {
      $idToken = $this->session->get('id_token');
      if ($idToken) {
        $logoutParams = [
          'id_token_hint' => $idToken,
          'post_logout_redirect_uri' => isset($this->config['post_logout_redirect_uri']) ? 
            $this->config['post_logout_redirect_uri'] : '/'
        ];
        return $this->metadata->end_session_endpoint . '?' . http_build_query($logoutParams);
      }
    }
    
    return null;
  }
  
  /**
   * Check if the user is authenticated
   * 
   * @return bool True if authenticated
   */
  public function isAuthenticated() {
    return $this->session->isAuthenticated();
  }
  
  /**
   * Get the authenticated user information
   * 
   * @return array|null User information or null if not authenticated
   */
  public function getUser() {
    return $this->session->getUser();
  }
}
