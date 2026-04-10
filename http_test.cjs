const axios = require('axios');

async function check() {
  try {
    const res = await axios.post('https://us-central1-ai-assistant-8977c.cloudfunctions.net/classifyMessage', {
      data: { message: "Hello I need help!" }
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("STATUS:", err.response.status);
      console.log("BODY:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}
check();
