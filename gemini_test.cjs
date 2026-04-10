const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyCHpy2n52eGXHIF38pY5HKuzdlS-UWc0R0');

async function check() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("Hello");
    console.log("FLASH SUCCESS:", result.response.text());
  } catch (e) {
    console.error("FLASH ERROR:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("PRO SUCCESS:", result.response.text());
  } catch (e) {
    console.error("PRO ERROR:", e.message);
  }
}
check();
