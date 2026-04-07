const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { db } = require('./firebase.service');
const { pipelineService } = require('./pipeline.service');
const { SELECTORS, DELAYS } = require('../config/config');

class InstagramWorker {
  constructor(uid, config) {
    this.uid = uid;
    this.username = config.username;
    this.password = config.password;
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    this.processedMessages = new Set();
    this.sessionPath = path.join(__dirname, `../sessions/${uid}_cookies.json`);
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`[${this.uid}] Starting worker for ${this.username}...`);
    
    try {
      await this.initBrowser();
      await this.login();
      this.monitorLoop();
    } catch (error) {
      logger.error(`[${this.uid}] Worker startup failed:`, error);
      this.stop();
    }
  }

  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async login() {
    // Session Loading
    if (await fs.pathExists(this.sessionPath)) {
      const cookies = await fs.readJson(this.sessionPath);
      await this.page.setCookie(...cookies);
      logger.info(`[${this.uid}] Session cookies loaded.`);
    }

    await this.page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

    if (await this.page.$(SELECTORS.loginForm)) {
      logger.info(`[${this.uid}] Logging in manually...`);
      await this.page.type('input[name="username"]', this.username, { delay: 100 });
      await this.page.type('input[name="password"]', this.password, { delay: 100 });
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Save Session
      const cookies = await this.page.cookies();
      await fs.outputJson(this.sessionPath, cookies);
      logger.info(`[${this.uid}] Session saved.`);
    }
  }

  async monitorLoop() {
    while (this.isRunning) {
      try {
        await this.page.goto('https://www.instagram.com/direct/inbox/', { waitUntil: 'networkidle2' });
        
        const unreadItems = await this.page.$$(SELECTORS.unreadMessageRequest);
        if (unreadItems.length > 0) {
          logger.info(`[${this.uid}] Found ${unreadItems.length} unread conversations.`);
          for (const item of unreadItems) {
            await this.handleConversation(item);
          }
        }

        // Random jitter to look human
        const waitTime = Math.floor(Math.random() * (DELAYS.checkIntervalMax - DELAYS.checkIntervalMin) + DELAYS.checkIntervalMin);
        await new Promise(r => setTimeout(r, waitTime));
        
      } catch (error) {
        logger.error(`[${this.uid}] Error in monitor loop:`, error.message);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  async handleConversation(item) {
    try {
      await item.click();
      await new Promise(r => setTimeout(r, 2000));

      const messages = await this.page.$$(SELECTORS.messageText);
      if (messages.length === 0) return;

      const lastMessageElement = messages[messages.length - 1];
      const messageText = await this.page.evaluate(el => el.textContent, lastMessageElement);
      
      const messageId = `${this.uid}_${messageText.slice(0, 20)}_${Date.now()}`; // Simple dedupe logic

      if (this.processedMessages.has(messageId)) return;
      this.processedMessages.add(messageId);

      logger.info(`[${this.uid}] New message: "${messageText}"`);

      // Fetch dynamic context from Firestore for this tenant
      const tenantDoc = await db.collection('tenants').doc(this.uid).get();
      const tenantData = tenantDoc.data() || {};

      const context = {
        businessName: tenantData.businessName || this.username,
        tone: tenantData.tone || 'professional',
        retrieved_chunks: (tenantData.knowledgeBase || [])
          .map(card => `${card.title}: ${card.content}`)
          .join('\n')
      };

      // 5-Stage Pipeline logic
      const result = await pipelineService.processMessage(messageText, context);

      if (result.autoSend) {
        logger.success(`[${this.uid}] Auto-sending reply: "${result.reply}"`);
        await this.sendReply(result.reply);
      } else {
        logger.info(`[${this.uid}] Manual review required. Confidence too low.`);
      }

    } catch (error) {
      logger.error(`[${this.uid}] Failed to handle conversation:`, error);
    }
  }

  async sendReply(text) {
    const inputSelector = 'div[aria-label="Message"]';
    await this.page.waitForSelector(inputSelector);
    await this.page.click(inputSelector);
    
    // Human-like typing
    for (const char of text) {
      await this.page.keyboard.sendCharacter(char);
      await new Promise(r => setTimeout(r, Math.random() * 150 + 50));
    }

    await this.page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));
  }

  async stop() {
    this.isRunning = false;
    if (this.browser) await this.browser.close();
    logger.info(`[${this.uid}] Worker stopped.`);
  }
}

module.exports = { InstagramWorker };
