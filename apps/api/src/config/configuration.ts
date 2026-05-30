export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    name: process.env.DB_NAME ?? 'unspam',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
  },
  interceptionMode: process.env.INTERCEPTION_MODE ?? 'native',
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    forwardTo: process.env.FORWARD_TO_NUMBER,
  },
  numverify: {
    apiKey: process.env.NUMVERIFY_API_KEY,
  },
  scorer: {
    url: process.env.SCORER_URL ?? 'http://scorer:8000',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme',
  },
});
