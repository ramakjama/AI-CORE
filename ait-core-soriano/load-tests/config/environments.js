// Environment configurations for load testing

export const environments = {
  development: {
    baseUrl: __ENV.API_GATEWAY_URL || 'http://localhost:4003',
    authServiceUrl: __ENV.AUTH_SERVICE_URL || 'http://localhost:4001',
    datahubServiceUrl: __ENV.DATAHUB_SERVICE_URL || 'http://localhost:4002',
    notificationServiceUrl: __ENV.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
    documentServiceUrl: __ENV.DOCUMENT_SERVICE_URL || 'http://localhost:4005',
  },
  staging: {
    baseUrl: __ENV.STAGING_API_GATEWAY_URL || 'https://staging-api.ait-core.com',
    authServiceUrl: __ENV.STAGING_AUTH_SERVICE_URL || 'https://staging-auth.ait-core.com',
    datahubServiceUrl: __ENV.STAGING_DATAHUB_SERVICE_URL || 'https://staging-data.ait-core.com',
    notificationServiceUrl: __ENV.STAGING_NOTIFICATION_SERVICE_URL || 'https://staging-notifications.ait-core.com',
    documentServiceUrl: __ENV.STAGING_DOCUMENT_SERVICE_URL || 'https://staging-documents.ait-core.com',
  },
  production: {
    baseUrl: __ENV.PROD_API_GATEWAY_URL || 'https://api.ait-core.com',
    authServiceUrl: __ENV.PROD_AUTH_SERVICE_URL || 'https://auth.ait-core.com',
    datahubServiceUrl: __ENV.PROD_DATAHUB_SERVICE_URL || 'https://data.ait-core.com',
    notificationServiceUrl: __ENV.PROD_NOTIFICATION_SERVICE_URL || 'https://notifications.ait-core.com',
    documentServiceUrl: __ENV.PROD_DOCUMENT_SERVICE_URL || 'https://documents.ait-core.com',
  },
};

export const getEnvironment = () => {
  const env = __ENV.ENVIRONMENT || 'development';
  return environments[env] || environments.development;
};

export default getEnvironment();
