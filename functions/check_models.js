const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCHpy2n52eGXHIF38pY5HKuzdlS-UWc0R0');
    console.log("MODELS:", res.data.models.map(m => m.name).join(', '));
  } catch (err) {
    if (err.response) {
      console.log("ERROR BODY:", err.response.data);
    } else {
      console.log("ERROR:", err.message);
    }
  }
}
check();
