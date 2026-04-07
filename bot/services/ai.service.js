const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: config.ai.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.ai.openRouterKey}`,
        'Content-Type': 'application/json',
      }
    });
  }

  async classifyMessage(message) {
    logger.ai(`Classifying message: "${message.substring(0, 30)}..."`);
    const prompt = `You are an AI that classifies customer messages.
Categories:
- simple_question (price, location, availability)
- order_intent (ready to buy or proceed)
- inquiry (needs explanation)
- complaint (angry or dissatisfied)
- complex (multiple or unclear requests)

Message: "${message}"

Return ONLY valid JSON:
{
  "category": "category_name",
  "confidence": 0.95
}`;

    try {
      const response = await this.client.post('/chat/completions', {
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      logger.error('Classification failed');
      return { category: 'inquiry', confidence: 0 };
    }
  }

  async generateReply(message, context, history = []) {
    logger.ai('Generating reply...');
    const prompt = `You are a helpful customer support assistant.
Context: ${context}
User Message: "${message}"
History: ${JSON.stringify(history)}

Instructions:
- Be polite and concise (1-2 sentences).
- Use the context provided.
- If unsure, ask a follow-up.

Return ONLY valid JSON:
{
  "reply": "your response",
  "confidence": 0.9
}`;

    try {
      const response = await this.client.post('/chat/completions', {
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      logger.error('Generation failed');
      return { reply: "I'm sorry, I'm having trouble processing that right now.", confidence: 0 };
    }
  }

  async validateReply(reply) {
    logger.ai('Reviewing reply for safety/accuracy...');
    const prompt = `Review this customer support reply for accuracy and politeness.
Reply: "${reply}"

If it's good, return it exactly. If not, fix it.
Return ONLY the text of the reply.`;

    try {
      const response = await this.client.post('/chat/completions', {
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }]
      });
      return response.data.choices[0].message.content.trim();
    } catch (err) {
      return reply;
    }
  }
}

module.exports = new AIService();
