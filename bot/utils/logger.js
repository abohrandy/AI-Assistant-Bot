module.exports = {
  info: (msg) => console.log(`[\x1b[36mINFO\x1b[0m] ${new Date().toLocaleTimeString()} - ${msg}`),
  warn: (msg) => console.log(`[\x1b[33mWARN\x1b[0m] ${new Date().toLocaleTimeString()} - ${msg}`),
  error: (msg) => console.log(`[\x1b[31mERROR\x1b[0m] ${new Date().toLocaleTimeString()} - ${msg}`),
  success: (msg) => console.log(`[\x1b[32mSUCCESS\x1b[0m] ${new Date().toLocaleTimeString()} - ${msg}`),
  ai: (msg) => console.log(`[\x1b[35mAI\x1b[0m] ${new Date().toLocaleTimeString()} - ${msg}`),
};
