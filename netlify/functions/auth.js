exports.handler = async function(event, context) {
    try {
      // Only accept POST requests
      if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
      }
  
      const { password } = JSON.parse(event.body);
      const correctPassword = process.env.APP_PASSWORD;
  
      // Check if the password is correct
      if (password === correctPassword) {
        // Return the API key
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            apiKey: process.env.ANTHROPIC_API_KEY
          })
        };
      } else {
        // Return error for incorrect password
        return {
          statusCode: 401,
          body: JSON.stringify({
            success: false,
            error: 'Incorrect password'
          })
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server error', message: error.message })
      };
    }
  };