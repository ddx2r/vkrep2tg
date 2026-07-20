// test/setupEnv.js — заглушки для обязательных переменных окружения (см. src/config.js),
// чтобы `npm test` не завершался process.exit(1) при импорте модулей без реального .env.
// Preload'ится через `node --require ./test/setupEnv.js --test` (см. package.json).
const defaults = {
  VK_GROUP_ID: '1',
  VK_SECRET_KEY: 'test-secret',
  VK_SERVICE_KEY: 'test-service-key',
  TELEGRAM_BOT_TOKEN: '123456:TEST-TOKEN',
  TELEGRAM_CHAT_ID: '-100000000000',
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
