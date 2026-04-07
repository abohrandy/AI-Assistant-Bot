import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();

// 1. Classification Function
export const classifyMessage = functions.runWith({
  secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
  const { message } = data;
  if (!message) throw new functions.https.HttpsError("invalid-argument", "Missing message.");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new functions.https.HttpsError("internal", "Missing API Key.");

  const genAI = new GoogleGenerativeAI(apiKey);
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
  } catch (error) {
    console.error("Classification error:", error);
    throw new functions.https.HttpsError("internal", "Classification failed.");
  }
});

// 2. Knowledge Filtering Function
export const filterKnowledge = functions.runWith({
  secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
  const { message, retrieved_chunks } = data;
  if (!message || !retrieved_chunks) {
    throw new functions.https.HttpsError("invalid-argument", "Missing message or chunks.");
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  if (!apiKey) throw new functions.https.HttpsError("internal", "Missing API Key.");

  const genAI = new GoogleGenerativeAI(apiKey);
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
  } catch (error) {
    console.error("Filtering error:", error);
    throw new functions.https.HttpsError("internal", "Knowledge filtering failed.");
  }
});
// 3. Human-like Reply Function
export const generateReply = functions.runWith({
  secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
  const { businessName, tone, context: bizContext, history, message } = data;
  if (!message) throw new functions.https.HttpsError("invalid-argument", "Missing message.");

  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
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
  } catch (error) {
    console.error("Reply generation error:", error);
    throw new functions.https.HttpsError("internal", "Reply generation failed.");
  }
});
// 4. Reply Review Function
export const reviewReply = functions.runWith({
  secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
  const { reply, context: bizContext } = data;
  if (!reply) throw new functions.https.HttpsError("invalid-argument", "Missing reply.");

  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  } catch (error) {
    console.error("Review error:", error);
    throw new functions.https.HttpsError("internal", "Review failed.");
  }
});

// 5. FAQ Matcher Function
export const matchFAQ = functions.runWith({
  secrets: ["GEMINI_API_KEY"],
}).https.onCall(async (data, context) => {
  const { message, faqs } = data;
  if (!message || !faqs) throw new functions.https.HttpsError("invalid-argument", "Missing message or FAQs.");

  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
  } catch (error) {
    console.error("Match error:", error);
    throw new functions.https.HttpsError("internal", "Matching failed.");
  }
});
