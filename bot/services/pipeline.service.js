const aiService = require('./ai.service');
const instagramService = require('./instagram.service');
const logger = require('../utils/logger');
const config = require('../config/config');

class PipelineService {
  constructor() {
    this.mockContext = [
      { topic: 'pricing', detail: 'Our basic plan is $49/mo, and the premium plan is $99/mo.' },
      { topic: 'location', detail: 'We are located in Silicon Valley, but we operate globally.' },
      { topic: 'hours', detail: 'Our support team is available 24/7 via email and DM.' }
    ];
  }

  async processMessage(message) {
    try {
      // Stage 1: Classify
      const classification = await aiService.classifyMessage(message);
      logger.info(`Intent: ${classification.category} (${(classification.confidence * 100).toFixed(1)}%)`);

      // Stage 2: Retrieve Context (Simple Mock)
      const context = this.retrieveContext(message);
      logger.info(`Context retrieved: ${context ? 'Found' : 'Generic'}`);

      // Stage 3: Generate Reply
      const replyData = await aiService.generateReply(message, context || 'Be helpful and polite.');
      
      // Stage 4: Safety/Review
      const finalReply = await aiService.validateReply(replyData.reply);

      // Stage 5: Decision (Auto-Send Rules)
      const shouldAutoSend = (
        classification.category === config.rules.autoSendCategory &&
        classification.confidence >= config.rules.minClassificationConfidence &&
        replyData.confidence >= config.rules.minAiConfidence
      );

      if (shouldAutoSend) {
        logger.success('AUTO-SEND triggered based on high confidence.');
        
        // Add random delay to simulate human pause
        const delay = Math.floor(Math.random() * (config.rules.maxDelay - config.rules.minDelay)) + config.rules.minDelay;
        logger.info(`Simulating human delay: ${(delay / 1000).toFixed(1)}s...`);
        
        setTimeout(async () => {
          await instagramService.sendReply(finalReply);
        }, delay);
      } else {
        logger.warn('HOLDING message. Confidence scores too low or complex intent.');
        logger.info(`Final proposed reply: "${finalReply}"`);
      }

    } catch (err) {
      logger.error(`Pipeline Error: ${err.message}`);
    }
  }

  retrieveContext(message) {
    const lowerMessage = message.toLowerCase();
    const match = this.mockContext.find(c => lowerMessage.includes(c.topic));
    return match ? match.detail : null;
  }
}

module.exports = new PipelineService();
