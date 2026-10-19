<?php

namespace App\Auth;

use App\Utils\SessionManager;

class OktaAuthService
{
    private $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    /**
     * Get the authorization URL for Okta login
     *
     * @return string
     */
    public function getAuthorizationUrl(): string
    {
        $query = http_build_query([
            'client_id' => $this->config['okta']['clientId'],
            'response_type' => 'code',
            'scope' => $this->config['okta']['scopes'],
            'redirect_uri' => $this->config['okta']['redirectUri'],
            'state' => $this->generateState(),
        ]);

        return $this->config['okta']['issuer'] . '/v1/authorize?' . $query;
    }

    /**
     * Exchange authorization code for tokens
     *
     * @param string $code
     * @return array
     */
    public function getTokens(string $code): array
    {
        try {
            // Set up the POST data
            $postData = http_build_query([
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->config['okta']['redirectUri'],
                'client_id' => $this->config['okta']['clientId'],
                'client_secret' => $this->config['okta']['clientSecret'],
            ]);

            // Set up the request options
            $options = [
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/x-www-form-urlencoded',
                    'content' => $postData,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => $this->config['app']['env'] === 'production',
                    'verify_peer_name' => $this->config['app']['env'] === 'production',
                ],
            ];

            // Create the stream context
            $context = stream_context_create($options);

            // Make the request
            $response = file_get_contents($this->config['okta']['issuer'] . '/v1/token', false, $context);

            // Check for errors
            if ($response === false) {
                error_log('Error exchanging code for tokens: Unable to make request');
                return [];
            }

            // Parse the response
            return json_decode($response, true) ?: [];
        } catch (\Exception $e) {
            error_log('Error exchanging code for tokens: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Enhanced ID token verification
     * This performs more thorough JWT validation
     *
     * @param string $idToken
     * @return array|null
     */
    public function verifyIdToken(string $idToken): ?array
    {
        try {
            // Split the token into parts
            $parts = explode('.', $idToken);
            if (count($parts) !== 3) {
                error_log('Invalid token format: Token must have 3 parts');
                return null;
            }

            // Decode the header and payload
            $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            
            // Check header
            if (!isset($header['alg'])) {
                error_log('Invalid token: Missing algorithm in header');
                return null;
            }
            
            // Verify algorithm (should be RS256 for Okta)
            if ($header['alg'] !== 'RS256') {
                error_log('Invalid token algorithm: ' . ($header['alg'] ?? 'unknown'));
                return null;
            }
            
            // Comprehensive validation
            $now = time();
            
            // Check if token is expired
            if (!isset($payload['exp'])) {
                error_log('Invalid token: Missing expiration claim');
                return null;
            }
            
            if ($payload['exp'] < $now) {
                error_log('ID token has expired');
                return null;
            }
            
            // Check if token is used before it's valid (not before claim)
            if (isset($payload['nbf']) && $payload['nbf'] > $now) {
                error_log('Token not yet valid');
                return null;
            }
            
            // Check issued at time
            if (isset($payload['iat']) && $payload['iat'] > $now) {
                error_log('Token issued in the future');
                return null;
            }
            
            // Check issuer
            if (!isset($payload['iss'])) {
                error_log('Invalid token: Missing issuer claim');
                return null;
            }
            
            if ($payload['iss'] !== $this->config['okta']['issuer']) {
                error_log('Invalid token issuer: ' . $payload['iss']);
                return null;
            }
            
            // Check audience
            if (!isset($payload['aud'])) {
                error_log('Invalid token: Missing audience claim');
                return null;
            }
            
            // Handle both string and array audience formats
            $validAudience = false;
            if (is_array($payload['aud'])) {
                $validAudience = in_array($this->config['okta']['clientId'], $payload['aud']);
            } else {
                $validAudience = $payload['aud'] === $this->config['okta']['clientId'];
            }
            
            if (!$validAudience) {
                error_log('Invalid token audience');
                return null;
            }
            
            // Check subject
            if (!isset($payload['sub'])) {
                error_log('Invalid token: Missing subject claim');
                return null;
            }
            
            // In production, you would verify the signature here
            // This would require fetching Okta's public keys and validating the signature
            if ($this->config['app']['env'] === 'production') {
                error_log('WARNING: Token signature validation not implemented');
                // In a real production app, you would use a proper JWT library for this
            }
            
            return $payload;
        } catch (\Exception $e) {
            error_log('Error verifying ID token: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user info from access token
     *
     * @param string $accessToken
     * @return array
     */
    public function getUserInfo(string $accessToken): array
    {
        try {
            // Set up the request options
            $options = [
                'http' => [
                    'method' => 'GET',
                    'header' => 'Authorization: Bearer ' . $accessToken,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => $this->config['app']['env'] === 'production',
                    'verify_peer_name' => $this->config['app']['env'] === 'production',
                ],
            ];

            // Create the stream context
            $context = stream_context_create($options);

            // Make the request
            $response = file_get_contents($this->config['okta']['issuer'] . '/v1/userinfo', false, $context);

            // Check for errors
            if ($response === false) {
                error_log('Error getting user info: Unable to make request');
                return [];
            }

            // Parse the response
            return json_decode($response, true) ?: [];
        } catch (\Exception $e) {
            error_log('Error getting user info: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Logout the user
     *
     * @return string
     */
    public function getLogoutUrl(): string
    {
        $query = http_build_query([
            'id_token_hint' => SessionManager::get('id_token', ''),
            'post_logout_redirect_uri' => $this->config['app']['url'],
        ]);

        return $this->config['okta']['issuer'] . '/v1/logout?' . $query;
    }

    /**
     * Generate a random state parameter for CSRF protection
     *
     * @return string
     */
    private function generateState(): string
    {
        $state = bin2hex(random_bytes(16));
        SessionManager::set('oauth_state', $state);
        return $state;
    }

    /**
     * Validate the state parameter
     *
     * @param string $state
     * @return bool
     */
    public function validateState(string $state): bool
    {
        $valid = SessionManager::has('oauth_state') && $state === SessionManager::get('oauth_state');
        
        // Remove the state from session after validation to prevent replay attacks
        if (SessionManager::has('oauth_state')) {
            SessionManager::remove('oauth_state');
        }
        
        return $valid;
    }
}
