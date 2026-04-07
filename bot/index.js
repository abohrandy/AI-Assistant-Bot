const { tenantService } = require('./services/tenant.service');
const logger = require('./utils/logger');
require('dotenv').config();

async function bootstrap() {
  logger.info('--- AI Instagram Bot (SaaS Mode) ---');
  
  // 1. Start listening for Tenant changes
  tenantService.startListening();

  logger.success('Bot Management Service is live and watching Firestore.');

  // Handle termination
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    tenantService.stopListening();
    process.exit();
  });
}

bootstrap().catch(err => {
  logger.error('Bootstrap failed:', err);
  process.exit(1);
});
