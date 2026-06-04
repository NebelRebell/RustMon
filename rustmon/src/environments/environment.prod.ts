export const environment = {
  production: true,
  uDataApi: (window as any).__BACKEND_URL__ || 'http://localhost:3000',
  version: '3.0.0',
  apiPort: (window as any).__API_PORT__ || 8080
};
