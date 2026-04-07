import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// Stage 1: Classification
export const classifyMessage = async (message: string) => {
  const classify = httpsCallable(functions, 'classifyMessage');
  try {
    const result = await classify({ message });
    return result.data as { category: string; confidence: number };
  } catch (error) {
    console.error("Classification error:", error);
    throw error;
  }
};

// Stage 2: Knowledge Filtering
export const filterKnowledge = async (params: { message: string; knowledgeBase: string }) => {
  const filter = httpsCallable(functions, 'filterKnowledge');
  try {
    const result = await filter({ 
      message: params.message, 
      retrieved_chunks: params.knowledgeBase 
    });
    return result.data as { bullets: string };
  } catch (error) {
    console.error("Filtering error:", error);
    throw error;
  }
};

// Stage 3: Human-like Reply
export const generateReply = async (params: {
  businessName: string;
  tone: string;
  context: string;
  history: string;
  message: string;
}) => {
  const reply = httpsCallable(functions, 'generateReply');
  try {
    const result = await reply(params);
    return result.data as { reply: string; confidence: number };
  } catch (error) {
    console.error("Reply generation error:", error);
    throw error;
  }
};
// Stage 4: Reply Review
export const reviewReply = async (params: {
  reply: string;
  context: string;
}) => {
  const review = httpsCallable(functions, 'reviewReply');
  try {
    const result = await review(params);
    // Returns the final (potentially corrected) reply text
    return result.data as string;
  } catch (error) {
    console.error("Review error:", error);
    throw error;
  }
};

// Stage 5: FAQ Matching
export const matchFAQ = async (params: { message: string; faqs: string }) => {
  const match = httpsCallable(functions, 'matchFAQ');
  try {
    const result = await match(params);
    return result.data as string;
  } catch (error) {
    console.error("Match error:", error);
    throw error;
  }
};
