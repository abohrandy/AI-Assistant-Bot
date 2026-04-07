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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReply = exports.filterKnowledge = exports.classifyMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
exports.classifyMessage = functions.runWith({
    secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
    const { message } = data;
    if (!message)
        throw new functions.https.HttpsError("invalid-argument", "Missing message.");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new functions.https.HttpsError("internal", "Missing API Key.");
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        throw new functions.https.HttpsError("internal", "Classification failed.");
    }
});
exports.filterKnowledge = functions.runWith({
    secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
    const { message, retrieved_chunks } = data;
    if (!message || !retrieved_chunks) {
        throw new functions.https.HttpsError("invalid-argument", "Missing message or chunks.");
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        throw new functions.https.HttpsError("internal", "Missing API Key.");
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        throw new functions.https.HttpsError("internal", "Knowledge filtering failed.");
    }
});
exports.generateReply = functions.runWith({
    secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
    const { businessName, tone, context: bizContext, history, message } = data;
    if (!message)
        throw new functions.https.HttpsError("invalid-argument", "Missing message.");
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        throw new functions.https.HttpsError("internal", "Reply generation failed.");
    }
});
//# sourceMappingURL=index.js.map