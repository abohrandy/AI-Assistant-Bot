import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAk7Xk3BcUKonOff1eXjdpbGoAxIaT5EA0", // From .env
  authDomain: "ai-assistant-8977c.firebaseapp.com",
  projectId: "ai-assistant-8977c",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

const filterKnowledge = httpsCallable(functions, 'filterKnowledge');
filterKnowledge({ message: 'test', knowledgeBase: [], documents: [], webLinks: [] })
  .then(res => console.log("SUCCESS:", res.data))
  .catch(err => {
    console.error("ERROR CODE:", err.code);
    console.error("ERROR MESSAGE:", err.message);
  });
