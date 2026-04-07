const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const config = require('../config/config');
const logger = require('../utils/logger');
const path = require('path');

class InstagramService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookiesPath = path.join(__dirname, '../cookies.json');
    this.processedMessages = new Set(); // Simple in-memory de-duplication
  }

  async start() {
    logger.info('Starting Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true in production
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });

    const loggedIn = await this.login();
    if (loggedIn) {
      logger.success('Instagram session active.');
      await this.monitorInbox();
    }
  }

  async login() {
    // 1. Try loading cookies
    if (await fs.exists(this.cookiesPath)) {
      logger.info('Loading existing session cookies...');
      const cookies = await fs.readJSON(this.cookiesPath);
      await this.page.setCookie(...cookies);
      await this.page.goto(config.instagram.inboxUrl, { waitUntil: 'networkidle2' });

      // Check if we are actually in the inbox
      if (this.page.url().includes('direct/inbox')) {
        return true;
      }
    }

    // 2. Perform manual login if cookies fail
    logger.warn('Manual login required...');
    await this.page.goto(config.instagram.loginUrl, { waitUntil: 'networkidle2' });
    
    await this.page.waitForSelector(config.instagram.selectors.usernameInput);
    await this.page.type(config.instagram.selectors.usernameInput, config.instagram.username, { delay: 100 });
    await this.page.type(config.instagram.selectors.passwordInput, config.instagram.password, { delay: 100 });
    await this.page.click(config.instagram.selectors.loginButton);

    await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Save cookies for next time
    const cookies = await this.page.cookies();
    await fs.writeJSON(this.cookiesPath, cookies);
    logger.success('Login successful. Cookies saved.');
    return true;
  }

  async monitorInbox() {
    logger.info('Monitoring inbox for new messages...');
    
    // Simple loop to check for unread messages
    setInterval(async () => {
      try {
        await this.page.goto(config.instagram.inboxUrl, { waitUntil: 'networkidle2' });
        
        // Find conversation with unread badge (aria-label containing "unread")
        const unreadThread = await this.page.$(config.instagram.selectors.unreadBadge);
        
        if (unreadThread) {
          logger.info('New unread message detected!');
          // Click the parent or the thread button
          await unreadThread.click();
          await this.page.waitForTimeout(2000); // Wait for chat to load
          
          await this.handleNewMessage();
        }
      } catch (err) {
        logger.error(`Monitor Error: ${err.message}`);
      }
    }, 30000); // Check every 30 seconds
  }

  async handleNewMessage() {
    // Navigate to the bottom/latest message
    const messages = await this.page.$$(config.instagram.selectors.latestMessage);
    if (messages.length === 0) return;

    const latestMessageElement = messages[messages.length - 1];
    const messageText = await this.page.evaluate(el => el.textContent, latestMessageElement);
    
    // Simple de-duplication: check if we just textually saw this or use a more robust ID if possible
    const messageId = `${this.page.url()}_${messageText}`; 
    if (this.processedMessages.has(messageId)) {
      return;
    }

    this.processedMessages.add(messageId);
    logger.success(`Received: "${messageText}"`);

    // Emit event or call pipeline (this will be wired up in index.js)
    if (this.onMessageReceived) {
      await this.onMessageReceived(messageText);
    }
  }

  async sendReply(text) {
    logger.info(`Sending reply: "${text}"`);
    
    // 1. Simulate Human Typing
    await this.page.waitForSelector(config.instagram.selectors.chatInput);
    await this.page.focus(config.instagram.selectors.chatInput);
    
    for (const char of text) {
      await this.page.keyboard.type(char, { 
        delay: Math.floor(Math.random() * (config.rules.typingSpeedMax - config.rules.typingSpeedMin)) + config.rules.typingSpeedMin 
      });
    }

    // 2. Press Enter
    await this.page.keyboard.press('Enter');
    logger.success('Reply sent successfully.');
  }
}

module.exports = new InstagramService();
