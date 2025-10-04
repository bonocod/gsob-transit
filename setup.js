// setupMomoUser.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const subscriptionKey = 'e617b7a7109f416f895fd49baff5b691'; // your Primary Key
const userId = uuidv4(); // generate your own UUID

(async () => {
  try {
    // Step 1: Create API User
    await axios.post(
      'https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
      { providerCallbackHost: 'https://example.com' },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'X-Reference-Id': userId,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('API User created:', userId);

    // Step 2: Generate API Key
    const { data } = await axios.post(
      `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${userId}/apikey`,
      {},
      {
        headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
      }
    );
    console.log('API Key generated:', data.apiKey);

  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();
