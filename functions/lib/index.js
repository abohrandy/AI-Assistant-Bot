"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchFAQ = exports.reviewReply = exports.generateReply = exports.filterKnowledge = exports.classifyMessage = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const pdf = require("pdf-parse");
admin.initializeApp();
async function fetchPageContent(url) {
    try {
        const response = await axios_1.default.get(url, { timeout: 5000 });
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header').remove();
        return $('body').text()
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
    }
    catch (error) {
        console.error(`Scraping error for ${url}:`, error);
        return `Error reading page: ${url}`;
    }
}
async function parsePdfContent(url) {
    try {
        const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const data = await pdf(buffer);
        return data.text
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
    }
    catch (error) {
        console.error(`PDF parsing error for ${url}:`, error);
        return `Error reading PDF: ${url}`;
    }
}
exports.classifyMessage = (0, https_1.onCall)({ invoker: "public" }, async (request) => {
    const data = request.data;
    const { message } = data;
    if (!message)
        throw new https_1.HttpsError("invalid-argument", "Missing message.");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new https_1.HttpsError("unknown", "Missing API Key.");
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are an AI that classifies customer messages.

Categories:
- simple_question (price, location, availability)
- order_intent (ready to buy or proceed)
- inquiry (needs explanation)
- complaint (angry or dissatisfied)
- complex (multiple or unclear requests)

Message:
"${message}"

Rules:
- Choose ONLY one category
- Be strict (only simple questions should be "simple_question")

Return ONLY valid JSON:
{
  "category": "",
  "confidence": 0.0
}`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }
    catch (error) {
        console.error("Classification error:", error);
        throw new https_1.HttpsError("unknown", "Classification failed: " + error.message);
    }
});
exports.filterKnowledge = (0, https_1.onCall)({
    invoker: "public",
    timeoutSeconds: 60,
    memory: "512MiB"
}, async (request) => {
    const data = request.data;
    const { message, retrieved_chunks, webLinks, documents } = data;
    if (!message) {
        throw new https_1.HttpsError("invalid-argument", "Missing message.");
    }
    let dynamicContext = "";
    if (webLinks && Array.isArray(webLinks)) {
        const scraped = await Promise.all(webLinks.map(async (url) => {
            const content = await fetchPageContent(url);
            return `[WEB SOURCE: ${url}]\n${content}`;
        }));
        dynamicContext += scraped.join("\n\n");
    }
    if (documents && Array.isArray(documents)) {
        const parsed = await Promise.all(documents.map(async (doc) => {
            const content = await parsePdfContent(doc.url);
            return `[PDF SOURCE: ${doc.name}]\n${content}`;
        }));
        dynamicContext += parsed.join("\n\n");
    }
    const finalContext = `${retrieved_chunks || ""}\n\n${dynamicContext}`.trim();
    if (!finalContext)
        return { bullets: "No relevant business data found." };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new https_1.HttpsError("unknown", "Missing API Key.");
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are filtering business knowledge.

Customer message:
"${message}"

Business data:
${retrieved_chunks}

Instructions:
- Select ONLY the most relevant information
- Ignore unrelated details
- Keep it short and useful

Return bullet points only.`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return { bullets: text.trim() };
    }
    catch (error) {
        console.error("Filtering error:", error);
        throw new https_1.HttpsError("unknown", "Knowledge filtering failed: " + error.message);
    }
});
exports.generateReply = (0, https_1.onCall)({ invoker: "public" }, async (request) => {
    const data = request.data;
    const { businessName, tone, context: bizContext, history, message } = data;
    if (!message)
        throw new https_1.HttpsError("invalid-argument", "Missing message.");
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a human customer support assistant chatting on Instagram.

Business Name:
${businessName}

Tone:
${tone}

Relevant Business Info:
${bizContext}

Conversation History:
${history}

Customer Message:
"${message}"

Instructions:
- Reply like a real human (natural, not robotic)
- Keep it short (1–2 sentences)
- Use the business info provided
- If price is asked, answer clearly
- If unsure, ask a follow-up question
- Do NOT make up any information

Return ONLY valid JSON:
{
  "reply": "",
  "confidence": 0.0
}`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanedJson);
    }
    catch (error) {
        console.error("Reply generation error:", error);
        throw new https_1.HttpsError("unknown", "Reply generation failed: " + error.message);
    }
});
exports.reviewReply = (0, https_1.onCall)({ invoker: "public" }, async (request) => {
    const data = request.data;
    const { reply, context: bizContext } = data;
    if (!reply)
        throw new https_1.HttpsError("invalid-argument", "Missing reply.");
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are reviewing a reply before it is sent to a customer.

Reply:
"${reply}"

Business Context:
${bizContext}

Checklist:
- Is it accurate based on known business info?
- Is it polite and professional?
- Does it avoid guessing or making things up?

If the reply is good, return it unchanged.
If not, rewrite it correctly using the provided business info.

Return ONLY the final reply text.`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }
    catch (error) {
        console.error("Review error:", error);
        throw new https_1.HttpsError("unknown", "Review failed: " + error.message);
    }
});
exports.matchFAQ = (0, https_1.onCall)({ invoker: "public" }, async (request) => {
    const data = request.data;
    const { message, faqs } = data;
    if (!message || !faqs)
        throw new https_1.HttpsError("invalid-argument", "Missing message or FAQs.");
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are matching a customer message to a business FAQ.

Customer message:
"${message}"

FAQs:
${faqs}

Instructions:
- Find the closest matching FAQ
- If none matches, return "NONE"

Return ONLY the answer or "NONE".`;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    }
    catch (error) {
        console.error("Match error:", error);
        throw new https_1.HttpsError("unknown", "Matching failed: " + error.message);
    }
});
//# sourceMappingURL=index.js.map