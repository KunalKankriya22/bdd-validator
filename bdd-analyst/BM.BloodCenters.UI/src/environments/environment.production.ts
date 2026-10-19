// Production environment configuration
export const environment = {
  production: true,
  apiUrl: '',
  okta: {
    issuer: 'https://prod-{yourOktaDomain}.okta.com/oauth2/default',
    clientId: '{yourProductionClientId}',
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
    apiKey: '{yourProductionAtlasApiKey}',
  },
  apiConfig: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
};
