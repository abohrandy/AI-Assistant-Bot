import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import * as cheerio from "cheerio";
const pdf = require("pdf-parse");

admin.initializeApp();

// --- HELPERS ---

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(response.data);
    
    // Remove scripts and styles
    $('script, style, nav, footer, header').remove();
    
    return $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // Limit context size
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error);
    return `Error reading page: ${url}`;
  }
}

async function parsePdfContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const data = await pdf(buffer);
    return data.text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);
  } catch (error) {
    console.error(`PDF parsing error for ${url}:`, error);
    return `Error reading PDF: ${url}`;
  }
}

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
  timeoutSeconds: 60, // Increase timeout for scraping
  memory: "512MB"
}).https.onCall(async (data, context) => {
  const { message, retrieved_chunks, webLinks, documents } = data;
  if (!message) {
    throw new functions.https.HttpsError("invalid-argument", "Missing message.");
  }

  // 1. Process Dynamic Sources
  let dynamicContext = "";
  
  if (webLinks && Array.isArray(webLinks)) {
    const scraped = await Promise.all(webLinks.map(async (url: string) => {
      const content = await fetchPageContent(url);
      return `[WEB SOURCE: ${url}]\n${content}`;
    }));
    dynamicContext += scraped.join("\n\n");
  }

  if (documents && Array.isArray(documents)) {
    const parsed = await Promise.all(documents.map(async (doc: any) => {
      const content = await parsePdfContent(doc.url);
      return `[PDF SOURCE: ${doc.name}]\n${content}`;
    }));
    dynamicContext += parsed.join("\n\n");
  }

  const finalContext = `${retrieved_chunks || ""}\n\n${dynamicContext}`.trim();
  
  if (!finalContext) return { bullets: "No relevant business data found." };

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
