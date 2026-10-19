// Default/Development environment configuration
export const environment = {
  production: false,
  apiUrl: '',
  okta: {
    issuer: 'https://wellsky-ciam.oktapreview.com/oauth2/aussyy6p7tqLFjziZ1d6',
    clientId: '0oasdinhbsQ3pJxbM1d7',
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
    apiKey: '{yourAtlasApiKey}',
  },
  apiConfig: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  }
};
