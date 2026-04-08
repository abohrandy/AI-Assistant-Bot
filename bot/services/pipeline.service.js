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

  async processMessage(message, contextData = {}) {
    try {
      // Stage 1: Classify
      const classification = await aiService.classifyMessage(message);
      logger.info(`Intent: ${classification.category} (${(classification.confidence * 100).toFixed(1)}%)`);

      // Stage 2: Deep Context Retrieval
      let retrievedContext = contextData.retrieved_chunks || "";
      
      // Parse Web Links if present
      if (contextData.webLinks && Array.isArray(contextData.webLinks)) {
        logger.info(`Scraping ${contextData.webLinks.length} web links...`);
        const scraped = await Promise.all(contextData.webLinks.map(async (url) => {
          const content = await aiService.fetchPageContent(url);
          return `[WEB SOURCE: ${url}]\n${content}`;
        }));
        retrievedContext += `\n\n${scraped.join("\n\n")}`;
      }

      // Parse Documents if present
      if (contextData.documents && Array.isArray(contextData.documents)) {
        logger.info(`Parsing ${contextData.documents.length} documents...`);
        const parsed = await Promise.all(contextData.documents.map(async (doc) => {
          const content = await aiService.parsePdfContent(doc.url);
          return `[PDF SOURCE: ${doc.name}]\n${content}`;
        }));
        retrievedContext += `\n\n${parsed.join("\n\n")}`;
      }

      logger.info(`Context length: ${retrievedContext.length} chars`);

      // Stage 3: Generate Reply
      const replyData = await aiService.generateReply(message, retrievedContext || 'Be helpful and polite.', contextData.history || []);
      
      // Stage 4: Safety/Review
      const finalReply = await aiService.validateReply(replyData.reply);

      // Stage 5: Decision (Auto-Send Rules)
      const shouldAutoSend = (
        classification.category === config.rules.autoSendCategory &&
        classification.confidence >= config.rules.minClassificationConfidence &&
        replyData.confidence >= config.rules.minAiConfidence
      );

      return {
        reply: finalReply,
        autoSend: shouldAutoSend,
        classification,
        confidence: replyData.confidence
      };

    } catch (err) {
      logger.error(`Pipeline Error: ${err.message}`);
      return { reply: "I'm sorry, I'm having trouble processing that right now.", autoSend: false };
    }
  }
}

module.exports = new PipelineService();
