require('dotenv').config();

module.exports = {
  instagram: {
    username: process.env.IG_USERNAME,
    password: process.env.IG_PASSWORD,
    loginUrl: 'https://www.instagram.com/accounts/login/',
    inboxUrl: 'https://www.instagram.com/direct/inbox/',
    // These selectors are subject to change by Instagram
    selectors: {
      usernameInput: 'input[name="username"]',
      passwordInput: 'input[name="password"]',
      loginButton: 'button[type="submit"]',
      unreadBadge: 'span[aria-label*="unread"]', // Generic check for unread
      messageItem: 'div[role="button"]', // Inbox items
      chatInput: 'div[role="textbox"][aria-label="Message..."]',
      latestMessage: 'div[dir="auto"]', // Very generic, needs refinement in service
    }
  },
  ai: {
    openRouterKey: process.env.OPENROUTER_API_KEY,
    model: 'google/gemini-flash-1.5', // Using Gemini Flash as requested or similar fast model
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  rules: {
    autoSendCategory: 'simple_question',
    minClassificationConfidence: 0.9,
    minAiConfidence: 0.85,
    typingSpeedMin: 50, // ms per char
    typingSpeedMax: 150,
    minDelay: 15000, // 15s
    maxDelay: 90000, // 90s
  }
};
