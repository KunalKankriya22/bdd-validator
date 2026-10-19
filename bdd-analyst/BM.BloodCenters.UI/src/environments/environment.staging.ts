// Staging environment configuration
export const environment = {
  production: false,
  apiUrl: '',
  okta: {
    issuer: 'https://staging-{yourOktaDomain}.okta.com/oauth2/default',
    clientId: '{yourStagingClientId}',
    redirectUri: window.location.origin + '/login/callback',
    postLogoutRedirectUri: window.location.origin + '/login',
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
    tokenManager: {
      storage: 'sessionStorage'
    },
  },
  atlas: {
    theme: 'wellsky-theme',
    apiKey: '{yourStagingAtlasApiKey}',
  },
  apiConfig: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
};
