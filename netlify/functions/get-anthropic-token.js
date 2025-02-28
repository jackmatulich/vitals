exports.handler = async function() {
    try {
      // You could add additional validation here if needed
      return {
        statusCode: 200,
        body: JSON.stringify({
          apiKey: process.env.ANTHROPIC_API_KEY,
          // Optional: Add an expiration timestamp for additional security
          expires: Date.now() + 5 * 60 * 1000 // 5 minutes from now
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to generate token" })
      };
    }
  };