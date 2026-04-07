const { InstagramWorker } = require('./InstagramWorker');
const logger = require('../utils/logger');

class WorkerManager {
  constructor() {
    this.workers = new Map(); // uid -> InstagramWorker
  }

  async startWorker(uid, config) {
    if (this.workers.has(uid)) {
      logger.info(`[Manager] Worker for ${uid} already running. Updating...`);
      await this.stopWorker(uid);
    }

    const worker = new InstagramWorker(uid, config);
    this.workers.set(uid, worker);
    
    // Non-blocking start
    worker.start().catch(err => {
      logger.error(`[Manager] Critical failure in worker ${uid}:`, err);
      this.workers.delete(uid);
    });
    
    return true;
  }

  async stopWorker(uid) {
    const worker = this.workers.get(uid);
    if (worker) {
      await worker.stop();
      this.workers.delete(uid);
      logger.info(`[Manager] Worker for ${uid} stopped and removed.`);
    }
  }

  async status(uid) {
    const worker = this.workers.get(uid);
    return worker ? (worker.isRunning ? 'online' : 'starting') : 'offline';
  }
}

const workerManager = new WorkerManager();
module.exports = { workerManager };
