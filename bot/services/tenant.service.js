const { db } = require('./firebase.service');
const { workerManager } = require('./manager');
const logger = require('../utils/logger');

class TenantService {
  constructor() {
    this.db = db;
    this.unsubscribe = null;
  }

  startListening() {
    logger.info('[TenantService] Starting Firestore listener...');
    
    // Listen to the top-level 'tenants' collection
    this.unsubscribe = this.db.collection('tenants').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        const config = change.doc.data().botConfig;
        const uid = change.doc.id;

        if (!config) return;

        if (change.type === 'added' || change.type === 'modified') {
          this.handleConfigUpdate(uid, config);
        } else if (change.type === 'removed') {
          workerManager.stopWorker(uid);
        }
      });
    }, error => {
      logger.error('[TenantService] Firestore listener error:', error.message);
    });
  }

  async handleConfigUpdate(uid, config) {
    if (config.enabled && config.username && config.password) {
      logger.info(`[TenantService] Config updated for ${uid}. Starting/Restarting worker...`);
      await workerManager.startWorker(uid, config);
    } else {
      logger.info(`[TenantService] Bot disabled or missing credentials for ${uid}. Stopping worker...`);
      await workerManager.stopWorker(uid);
    }
  }

  stopListening() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

const tenantService = new TenantService();
module.exports = { tenantService };
