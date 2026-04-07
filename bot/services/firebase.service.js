const admin = require('firebase-admin');
const logger = require('../utils/logger');
const path = require('path');
require('dotenv').config();

function initialize() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // Priority 1: Environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      logger.info('[Firebase] Initialized with environment variable.');
    } 
    // Priority 2: Service account file
    else {
      const certPath = path.join(__dirname, '../service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(certPath)
      });
      logger.info('[Firebase] Initialized with service-account.json.');
    }
  } catch (error) {
    console.error('[Firebase] Failed to initialize Admin SDK:', error.message);
  }
}

// Initialize immediately
initialize();

const db = admin.firestore();

module.exports = { admin, db };
