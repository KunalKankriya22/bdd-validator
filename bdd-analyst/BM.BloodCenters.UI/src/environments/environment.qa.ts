// QA environment configuration
export const environment = {
  production: false,
  apiUrl: '',
  okta: {
    issuer: 'https://your-qa-org.okta.com/oauth2/default',  // Replace with your Okta dev org domain
    clientId: 'your-client-id-here',  // Replace with your Okta app client ID
    redirectUri: window.location.origin + '/login/callback',
    postLogoutRedirectUri: window.location.origin + '/login',
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
    tokenManager: {
      storage: 'sessionStorage'
    }
  },
  atlas: {
    theme: 'wellsky-theme',
    apiKey: '{yourAtlasApiKey}'
  },
  apiConfig: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  }
};
